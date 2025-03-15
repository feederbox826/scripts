import axios from 'axios'
import { URL } from 'url'
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"

export const getTSUrl = (urls) =>
  urls.find(
    url => (url.url.includes("teamskeet.com") && !url.url.includes("members.teamskeet.com"))
    || url.url.includes("mylf.com")
    || url.url.includes("swappz.com"))?.url

export function tsAPI(tsURL) {
  let API_BASE = ""
  let ORIGIN = ""
  if (tsURL.includes("teamskeet.com")) {
    API_BASE = "https://tours-store.psmcdn.net/ts-elastic-d5cat0jl5o-videoscontent/_doc/"
    ORIGIN = "https://www.teamskeet.com"
  } else if (tsURL.includes("mylf.com")) {
    API_BASE = "https://tours-store.psmcdn.net/mylf-elastic-hka5k7vyuw-videoscontent/_doc/"
    ORIGIN = "https://www.mylf.com"
  } else if (tsURL.includes("swappz.com")) {
    API_BASE = "https://tours-store.psmcdn.net/swap_bundle/_search?size=1&q=id:"
    ORIGIN = "https://www.swappz.com"
  } else {
    console.log("Invalid URL")
    return
  }

  const movieID = new URL(tsURL).pathname.split("/").pop()

  return axios.get(`${API_BASE}${movieID}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Origin': ORIGIN,
      "Referer": ORIGIN
    }
  }).then(res => {
    const tags = res.data._source.tags
    return tags.includes("Pumps")
  })
}