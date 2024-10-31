require("dotenv").config()
const axios = require('axios')
const URL = require('node:url').URL
const fs = require('node:fs')

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"

const resultsFile = fs.readFileSync("ts-pumps/results.json")
const results = new Map(JSON.parse(resultsFile))

const getTSUrl = (urls) =>
  urls.find(
    url => (url.url.includes("teamskeet.com") && !url.url.includes("members.teamskeet.com"))
    || url.url.includes("mylf.com")
    || url.url.includes("swappz.com"))?.url

function tsAPI(tsURL) {
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

const PROBLEMTAG = "717b2808-e2e4-4508-b981-a0da236ee541"

// plugins/stashdb-api
const callGQL = async (reqData) =>
  fetch(`https://stashdb.org/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ApiKey": process.env.STASHDB_API_KEY,
    },
    body: JSON.stringify(reqData),
  })
    .then((res) => res.json())
    .then((res) => res.data);

async function sdbFetch(page = 1) {
  const query = `query ($page: Int!, $tag: [ID!]) {
    queryScenes( input: {
      tags: { value: $tag modifier: INCLUDES }
      per_page: 25
      page: $page
    }) {
      count
      scenes {
        urls { url }
        id
      }}}`
  const variables = {
    page,
    tag: PROBLEMTAG
  }
  const data = await callGQL({ query, variables })
  return data
}

async function processScenes() {
  let page = 1
  let data = await sdbFetch(page)
  let scenes = data.queryScenes.scenes
  while (scenes.length > 0) {
    scenes.forEach(scene => {
      const tsURL = getTSUrl(scene.urls)
      // check if scene is in results
      if (results.has(scene.id)) {
        //console.log(`Scene ${scene.id} already in results`)
      } else if (!tsURL) {
        // if no URLs, add to results as false
        results.set(scene.id, false)
      } else if (tsURL) {
        // if has URLs, check if it has pumps
        tsAPI(tsURL).then(hasPumps => {
          // if has pumps, add to results as true
          results.set(scene.id, hasPumps)
        }).catch(err => {
          console.log("Error")
          console.log(scene.id)
        })
      } else {
        console.log("Error")
        console.log(scene.id)
      }
    })
    page++
    data = await sdbFetch(page)
    scenes = data.queryScenes.scenes
    fs.writeFileSync("ts-pumps/results.json", JSON.stringify([...results], null, 2))
  }
}

async function parseResults() {
  const results = fs.readFileSync("ts-pumps/results.json")
  const trueResults = JSON.parse(results).filter(([_, value]) => value === true)
  console.log(`${trueResults.length} teamskeet matches found`)
}

//processScenes()
parseResults()