import axios from "axios";
import 'dotenv/config'
import fs from "node:fs";

const gqlClient = axios.create({
  baseURL: "https://stashdb.org/graphql",
  method: "post",
  headers: {
    "Content-Type": "application/json",
    "ApiKey": process.env.APIKEY
  }
})

const getBacklog = async () => {
  if (fs.existsSync("backlog.json")) {
    return JSON.parse(fs.readFileSync("backlog.json"))
  } else {
    const data = await axios.get("https://github.com/peolic/stashdb_backlog_data/releases/download/cache/stashdb_backlog.json")
    fs.writeFileSync("backlog.json", JSON.stringify(data.data))
    return data.data
  }
}

const getFingerprintQuery = `query ($page: Int!) {
  queryScenes(
    input: { has_fingerprint_submissions: true, per_page: 20, page: $page }
  ) {
  count
  scenes {
    id
    fingerprints(is_submitted: true) {
      algorithm hash
  }}}}`

const getFingerprintPage = (page = 1) => gqlClient("", { data: { query: getFingerprintQuery, variables: { page } } })

const getFingerprints = async () => {
  const pages = await getFingerprintPage(1)
  const pageCount = Math.ceil(pages.data.data.queryScenes.count / 20)
  console.log(`Got ${pageCount} pages`)
  const data = pages.data.data.queryScenes.scenes
  for (let i = 2; i <= pageCount; i++) {
    const page = await getFingerprintPage(i)
    console.log(i)
    data.push(...page.data.data.queryScenes.scenes)
  }
  return data
}

const getCachedFingerprints = async () => {
  if (fs.existsSync("fingerprints.json")) {
    return JSON.parse(fs.readFileSync("fingerprints.json"))
  } else {
    const fingerprints = await getFingerprints()
    fs.writeFileSync("fingerprints.json", JSON.stringify(fingerprints))
    return fingerprints
  }
}

const getFingerprintMap = async () => {
  const fingerprints = await getCachedFingerprints()
  const fpMap = new Map()
  for (const scene of fingerprints) {
    for (const fingerprint of scene.fingerprints) {
      if (fingerprint.user_submitted) fpMap.set(fingerprint.hash, scene.id)
    }
  }
  return fpMap
}

const getBacklogMap = async () => {
  const backlog = await getBacklog()
  const backlogKeys = Object.keys(backlog)
  const backlogValues = Object.values(backlog)
  const backlogMap = new Map()
  for (let i = 0; i < backlogKeys.length; i++) {
    backlogMap.set(backlogKeys[i], backlogValues[i])
  }
  return backlogMap
}

const getMatches = async () => {
  const backlog = await getBacklogMap()
  console.log("got backlog")
  const fingerprints = await getCachedFingerprints()
  const fingerprintMap = await getFingerprintMap()
  console.log("got fingerprints")
  const sceneMatches = []
  for (const scene of fingerprints) {
    const match = backlog.get(`scene/${scene.id}`)
    if (match?.fingerprints) {
      for (const fingerprint of match.fingerprints) {
        if (fingerprintMap.has(fingerprint.hash)) {
          sceneMatches.push({
            id: scene.id,
            ...match
          })
          break
        }
      }
    }
  }
  console.log(sceneMatches)
  const results = JSON.stringify(sceneMatches, null, 2)
  fs.writeFileSync("results.json", results)
}
getMatches()