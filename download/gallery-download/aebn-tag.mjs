// usage:
// node aebn-tag.mjs --orientation straight

import { loadPage, existingFolderCheck, downloadURLFilename } from "./utils.mjs";
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
let orientation = argv?.orientation ?? "straight"; // straight or gay

async function crawlCategories(orientation = "straight") {
  // load categories page
  const $ = await loadPage(`https://${orientation}.aebn.com/${orientation}/categories`)
  const categories = $("div.dts-category-index-category-container .dts-category-index-category-item")
    .map((i, el) => {
      const name = $(el).text()
      const id = $(el).attr("id").split("-").pop()
      return { name, id }
    })
  // get file
  if (existingFolderCheck("aebn", `${orientation}-tag`)) return;
  for (const category of categories) {
    const url = `https://pic.aebn.net/dis/i/theater18/images/categories/${orientation}/${category.id}-500w.jpg`
    downloadURLFilename(url, `./aebn/${orientation}-tag`, `${category.name}.jpg`)
  }
}

async function main() {
  console.log(`Crawling ${orientation} categories`);
  await crawlCategories(orientation);
  console.log("Done");
}
main();
