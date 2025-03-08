// usage:
// node porngals4.mjs --name riley reid

import { getHref, loadPage, downloadURL, existingFolderCheck } from "./utils.mjs";
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
let name = argv.name;

async function crawlPornstar(name, num) {
  const $ = await loadPage(`https://www.porngals4.com/${name}/${num}/`)
  // find all links
  const links = getHref($, ".gl1>.item>div.img>a");
  return links;
}

async function crawlGallery(path) {
  const $ = await loadPage(`https://www.porngals4.com/${path}`)
  const title = $("h1").text();
  // check if directory exists
  if (existingFolderCheck("pg4", title)) return;
  console.log(`Crawling gallery ${title}`);
  const images = getHref($, ".gal>a");
  // download images
  for (const image of images) {
    downloadURL(image, `./pg4/${title}`);
  }
}

async function main() {
  if (!name) {
    console.error("Missing --name parameter");
    process.exit(1);
  }
  name = name.replace(" ", "-");
  // get page count
  const $ = await loadPage(`https://www.porngals4.com/${name}/`)
  const pageCount = $("ul.paging>li>a:not(.nav_item)").length + 1;
  for (let page = 1; page < pageCount; page++) {
    const galleryLinks = await crawlPornstar(name, page);
    for (const gallery of galleryLinks) {
      crawlGallery(gallery);
    }
  }
}
main();
