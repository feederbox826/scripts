// usage:
// node babesource.mjs --namepath angela-white-96

import { existingFolderCheck, getHref, loadPage, downloadURL } from "./utils.mjs";
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
let namepath = argv.namepath;

async function crawlPornstar(namepath, num) {
  const url = `https://babesource.com/pornstars/${namepath}/page${num}.html`;
  const $ = await loadPage(url);
  // find all links
  const links = getHref($, ".main-content__card-link");
  return links;
}

async function crawlGallery(path) {
  const $ = await loadPage(path);
  const title = path.split("/").pop().split(".").shift();
  if (existingFolderCheck("bs", title)) return;
  console.log(`Crawling gallery ${title}`);
  const images = getHref($, ".box-massage__card-link");
  // download images
  for (const image of images) {
    downloadURL(encodeURI(image), `./bs/${title}`);
  }
}

async function main() {
  if (!namepath) {
    console.error("Missing --namepath parameter");
    process.exit(1);
  }
  const $ = await loadPage(`https://babesource.com/pornstars/${namepath}/`);
  const pageCount = $("div.paginations>a.paginations__link").length
  for (let page = 1; page < pageCount; page++) {
    const galleryLinks = await crawlPornstar(namepath, page);
    for (const gallery of galleryLinks) {
      crawlGallery(gallery);
    }
  }
}
main();
