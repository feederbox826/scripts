// usage:
// node fitting-room.mjs --url "https://www.fitting-room.com/albums/176/mila-azul-selfie/"

import { loadPage, downloadURL, getSrc, existingFolderCheck } from "./utils.mjs";
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
const url = argv.url;

async function crawlGallery(url) {
  const galleryTitle = url.split("/").reverse()[1]
  if (existingFolderCheck("fitting-room", galleryTitle)) return;
  console.log(`Crawling gallery ${galleryTitle}`);
  const $ = await loadPage(url)
  const imgURLs = getSrc($, ".images>a>img.thumb")
  // download images
  for (const url of imgURLs) {
    const highResURL = url.replace("200x150", "1920x1920");
    downloadURL(highResURL, `./fitting-room/${galleryTitle}`);
  }
}

async function main() {
  if (!url) {
    console.error("Missing --url parameter");
    process.exit(1);
  }
  crawlGallery(url);
  console.log("Done");
}
main();
