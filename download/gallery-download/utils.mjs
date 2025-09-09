import axios from "axios";
import download from "download";
import sanitize from "sanitize-filename";
import fs from "fs";
import * as cheerio from "cheerio";

export const fakeClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "Cookie": "ageConfirmed=true",
  },
});

export const existingFolderCheck = (foldername, title) => {
  const titleName = sanitize(title);
  if (fs.existsSync
    (`./${foldername}/${titleName}`)) {
    console.log(`Gallery ${titleName} already exists`);
    return true;
  }
  return false;
}

export const downloadURLFilename = async (url, folder, filename, options={}) =>
  download(url, folder, { filename: sanitize(filename), ...options })

export const downloadURL = async (url, folder) =>
  download(url, folder, { filename: sanitize(url.split("/").pop()) });

export const loadPage = async (url) =>
  fakeClient.get(url).then(response => cheerio.load(response.data));

export const getHref = ($, selector) =>
  $(selector).map((i, el) => $(el).attr("href")).get();

export const getSrc = ($, selector) =>
  $(selector).map((i, el) => $(el).attr("src")).get();