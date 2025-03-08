// usage:
// node pornpics.mjs --name alina lopez

import { existingFolderCheck, fakeClient, loadPage, getHref, downloadURL } from "./utils.mjs";
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
let name = argv.name;

async function crawlPornstar(name, num) {
  const offset = num * 20;
  const url = `https://www.pornpics.com//search/srch.php?q=${name}&lang=en&limit=20&offset=${offset}`;
  // iterate over galleries
  const data = (await fakeClient.get(url)).data;
  for (const gallery of data) {
    await crawlGallery(gallery.g_url, gallery.desc);
  }
  if (data.length == 0) {
    console.log("No more galleries");
    process.exit(0);
  }
}

async function crawlGallery(url, title) {
  const $ = await loadPage(url);
  if (existingFolderCheck("pornpics", title)) return;
  console.log(`Crawling gallery ${title}`);
  const images = getHref($, ".thumbwook>a");
  // download images
  for (const image of images) {
    downloadURL(image, "./pornpics/" + title);
  }
}

async function main() {
  name = name.replace(" ", "+");
  for (let i = 0;; i++) {
    await crawlPornstar(name, i);
  }
}
main();
