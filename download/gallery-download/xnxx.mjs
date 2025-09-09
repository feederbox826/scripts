// usage:
// node xnxx.mjs --page 1 --thread https://forum.xnxx.com/a.552967/

import { fakeClient, loadPage, downloadURLFilename } from "./utils.mjs";
import minimist from 'minimist';
import probe from 'probe-image-size';

const argv = minimist(process.argv.slice(2));
let thread = argv.thread;
let page = argv.page || 1;

const filterLink = async (link) => {
  const MIN_RESOLUTION = 720; // minimum dimension in pixels
  return probe(link)
    .catch(err => {
      console.error(`Error probing image: ${err.message}`);
      return true; // treat as valid if probing fails
    })
    .then(result => result.width >= MIN_RESOLUTION
      && result.height >= MIN_RESOLUTION)
}

async function crawlPage(url, pageno) {
  const $ = await loadPage(url);
  console.log(`Crawling page ${pageno}`);
  // get lbTriggers
  const lbTriggers = $("blockquote>a.LbTrigger")
    .map((i, el) => {
      const href = $(el).attr("href");
      const filename = $(el).find("img").attr("alt");
      return { href, filename };
    }).get();
  // get direct images
  const images = $("blockquote>img.bbCodeImage.LbImage")
    .map((i, el) => {
      const src = $(el).attr("src");
      const filename = $(el).attr("alt") || `image-${i + 1}`;
      return { src, filename };
    }).get();
  // download images
  const downloadURLs = [ ...lbTriggers, ...images ]
    .filter(item => item.href || item.src)
    .map(item => {
      const url = item.href || item.src;
      // verify image size
      if (!filterLink(url)) {
        console.log(`Skipping ${url} due to size constraints`);
        return;
      }
      const filename = item.filename || url.slice(0,-1).split("/").pop();
      return { url, filename };
    })
    for (const { url, filename } of downloadURLs) {
      if (!url) continue; // skip if url is undefined
      //console.log(`Downloading ${filename} from ${url}`);
      // download with aria2c
      aria2cDownload(url, `./xnxx/${pageno}`)
      // download with retry logic
      downloadURLFilename(url, `./xnxx/${pageno}`, filename, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        },
        retry: {
          limit: 10,
        }
      }).catch(err => {
        console.error(`Error downloading ${url}: ${err.message}`);
      });
    }
}

async function main() {
  // split out page
  const baseUrl = thread.split("page-").shift();
  console.log(`Crawling thread ${baseUrl}`);
  for (let i = page;; i++) {
    // set timeout
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pageUrl = `${baseUrl}page-${i}`;
    // check that pageURL isnt 307
    const response = await fakeClient.head(pageUrl);
    if (response.status === 307) {
      console.log(`Last page, 307 redirect at ${pageUrl}`);
      process.exit(0);
    }
    await crawlPage(pageUrl, i);
  }
}
main();
