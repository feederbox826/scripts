// usage:
// node advde.mjs --search lorem+ipsum
// node advde.mjs --movie https://www.adultdvdempire.com/123456/lorem-ipsum.html

import { existingFolderCheck, getHref, loadPage, downloadURL } from "./utils.mjs";
import minimist from 'minimist';

const BASE_URL = 'https://www.adultdvdempire.com'

const argv = minimist(process.argv.slice(2));
let search = argv.search;
let movie = argv.movie;

// crawl gallery
async function crawlGallery(galleryURL, page=1) {
  const $ = await loadPage(`${BASE_URL}${galleryURL}?page=${page}`);
  const title = $("h1.list-page__headline").text().trim();
  if (existingFolderCheck("ade", title)) return;
  console.log(`Crawling gallery ${title}`);
  const images = getHref($, "a.thumb.fancy");
  for (const image of images) {
    downloadURL(encodeURI(image), `./advde/${title}`)
      .catch(err => console.error(`Error downloading ${image}: ${err.message}`));
  }
  // if images, try next page
  if (images.length > 0) {
    await crawlGallery(galleryURL, page + 1);
  } else {
    console.log(`Finished downloading gallery ${title}`);
  }
}

async function searchMovie(movieURL) {
  const $ = await loadPage(BASE_URL+movieURL);
  const title = $("h1").text().trim();
  const galleryLink = $("a.gallery-link").attr("href");
  if (galleryLink) {
    await crawlGallery(galleryLink);
  } else {
    console.log(`No gallery found for movie ${title}`);
  }
}

async function crawlSearch(query) {
  const url = `https://www.adultdvdempire.com/VOD/Search?q=${query}&sort=bestseller_sorts&media=14`;
  const $ = await loadPage(url);
  // find all links
  const movies = getHref($, 'div>a[label="Title"]');
  return movies;
}

async function main() {
  if (search) {
    const namepath = search.replace(/\s+/g, '+');
    const movieLinks = await crawlSearch(namepath);
    console.log(`Found ${movieLinks.length} movies for search "${search}"`);
    for (const movie of movieLinks) {
      await searchMovie(movie);
    }
  }
  else if (movie) {
    await searchMovie(movie);
  } else {
    console.error("Missing --search or --movie parameter");
    process.exit(1);
  }
}
main();
