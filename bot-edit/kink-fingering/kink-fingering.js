import 'dotenv/config'
import fs from "fs"
import { tagFetch } from "../stashdb.js"
import { getTSUrl, tsAPI } from "../ts-api.js"
import { editScene } from "../stashdb.js"

const resultsFile = fs.readFileSync("kink-fingering/results.json")
const results = new Map(JSON.parse(resultsFile))
const PROBLEMTAG = "e3e896e5-3cc5-4fb9-9e7e-ce56259fefc3"

async function processScenes() {
  let page = 1
  let data = await tagFetch(PROBLEMTAG, page)
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
    data = await tagFetch(PROBLEMTAG, page)
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
  const batch = trueResults.slice(start, start+300)
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

//processScenes()
parseResults()