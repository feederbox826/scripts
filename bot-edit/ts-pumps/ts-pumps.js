import 'dotenv/config'
import fs from "fs"
import { callGQL } from "../stashdb.js"
import { getTSUrl, tsAPI } from "../ts-api.js"
import { editScene } from "../stashdb.js"

const resultsFile = fs.readFileSync("ts-pumps/results.json")
const results = new Map(JSON.parse(resultsFile))
const PROBLEMTAG = "717b2808-e2e4-4508-b981-a0da236ee541"

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
        title
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
        results.set(scene.id, { hasPumps: false,  title: scene.title })
      } else if (tsURL) {
        // if has URLs, check if it has pumps
        tsAPI(tsURL).then(hasPumps => {
          // if has pumps, add to results as true
          results.set(scene.id, { hasPumps, title: scene.title })
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

async function fixScene(sceneID) {
  const badTag = "717b2808-e2e4-4508-b981-a0da236ee541"
  const newTag = "cf37312c-06fc-49bd-9537-a13e84ebcf0d"
  const comment = `TeamSkeet uses Pumps to refer to the shoes which conflicts with the StashDB alias. A CommunityScripts PR was merged but the remnants are being cleaned up. See https://u.feederbox.cc/ts-pumps for details`
  editScene(sceneID, badTag, newTag, comment)
}

async function parseResults() {
  const results = fs.readFileSync("ts-pumps/results.json")
  const trueResults = JSON.parse(results)
    .filter(([_, value]) => value.hasPumps === true)
    .map(([key, _]) => key)
  console.log(`${trueResults.length} teamskeet matches found`)
  
  const start = 0
  const batch = trueResults.slice(start, start+20)
  console.log(`Processing batch of ${batch.length}`)
  // process all results
  for (let i = 0; i < batch.length; i++) {
    const sceneID = batch[i]
    console.log(`Processing scene ${sceneID}`)
    fixScene(sceneID)
    // add delay
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

processScenes()
//parseResults()