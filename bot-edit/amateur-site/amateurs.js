import fs, { read } from "fs"
import { paginatedFetch } from "../stashdb.js"

const findCandidateStudios = async (page = 0) => {
  const query = `query ($page: Int!) {
    queryStudios(input: { has_parent: false, page: $page }) {
      count
      studios {
        id
        deleted
        urls { url }
        child_studios { id }
      }}}`
  const studios = await paginatedFetch({ query })
  return studios
    .filter(studio => studio.deleted === false)
    .filter(studio => studio.child_studios.length == 0)
    .filter(studio => studio.urls.length == 1)
}

// fetch all studios
async function getAllStudios() {
  if (fs.existsSync("amateur-site/studios.json")) {
    return JSON.parse(fs.readFileSync("amateur-site/studios.json"))
  } else {
    const studios = await findCandidateStudios()
    fs.writeFileSync("amateur-site/studios.json", JSON.stringify(studios, null, 2))
    return studios
  }
}

const arrToFile = (filename, arr) => {
  const newArr = arr.map(item => `https://stashdb.org/studios/${item}`)
  fs.writeFileSync(`amateur-site/results/${filename}.json`, JSON.stringify(newArr, null, 2))
}

// map studios
async function main() {
  const studios = await getAllStudios()
  const studioMap = new Map()
  const domainMap = new Map()
  const noURLStudios = []
  const pornhubStudios = []
  const xvideoStudio = []
  const slrStudios = []
  const c4sStudios = []
  const mvStudios = []
  const analvidsStudios = []
  studios.forEach(studio => {
    // check common domains
    if (!studio.urls.length) {
      noURLStudios.push(studio.id)
      return
    }
    const url = new URL(studio.urls[0].url)
    const domain = url.hostname
    // pornhub
    if (domain.includes("pornhub")) pornhubStudios.push(studio.id)
    else if (domain.includes("xvideos")) xvideoStudio.push(studio.id)
    else if (domain.includes("sexlikereal")) slrStudios.push(studio.id)
    else if (domain.includes("clips4sale")) c4sStudios.push(studio.id)
    else if (domain.includes("manyvids")) mvStudios.push(studio.id)
    else if (domain.includes("analvids")) analvidsStudios.push(studio.id)
    else {
      studioMap.set(studio.id, url)
      if (!domainMap.has(domain)) domainMap.set(domain, 1)
      else domainMap.set(domain, domainMap.get(domain) + 1)
    }
  })
  // filter domainMap
  const filteredDomainMap = new Map([...domainMap].filter(([_, v]) => v > 1))
  console.log(filteredDomainMap)
  // dump to file
  fs.writeFileSync("amateur-site/results/studios.json", JSON.stringify([...studioMap], null, 2))
  arrToFile("pornhub-studios",pornhubStudios)
  arrToFile("xvideos-studios",xvideoStudio)
  arrToFile("slr-studios",slrStudios)
  arrToFile("c4s-studios",c4sStudios)
  arrToFile("mv-studios",mvStudios)
  arrToFile("analvids-studios",analvidsStudios)
  arrToFile("no-url-studios",noURLStudios)
}

const readJSONFile = (filename) =>
  fs.existsSync(`amateur-site/results/${filename}.json`)
    ? JSON.parse(fs.readFileSync(`amateur-site/results/${filename}.json`))
    : []

// reprocess
async function reprocess() {
  const studios = JSON.parse(fs.readFileSync("amateur-site/results/studios.json"))
  const studioMap = new Map()
  const domainMap = new Map()
  const noURLStudios = readJSONFile("no-url-studios")
  const pornhubStudios = readJSONFile("pornhub-studios")
  const xvideoStudio = readJSONFile("xvideos-studios")
  const slrStudios = readJSONFile("slr-studios")
  const c4sStudios = readJSONFile("c4s-studios")
  const mvStudios = readJSONFile("mv-studios")
  const analvidsStudios = readJSONFile("analvids-studios")
  const iwcStudios = readJSONFile("iwc-studios")
  const pornboxStudios = readJSONFile("pornbox-studios")
  const mydirtyHobbyStudios = readJSONFile("mydirtyhobby-studios")
  const vrpornStudios = readJSONFile("vrporn-studios")
  studios.forEach(studio => {
    const id = studio[0]
    const url = new URL(studio[1])
    const domain = url.hostname
    // pornhub
    if (domain.includes("pornhub")) pornhubStudios.push(id)
    else if (domain.includes("xvideos")) xvideoStudio.push(id)
    else if (domain.includes("sexlikereal")) slrStudios.push(id)
    else if (domain.includes("clips4sale")) c4sStudios.push(id)
    else if (domain.includes("manyvids")) mvStudios.push(id)
    else if (domain.includes("analvids")) analvidsStudios.push(id)
    else if (domain.includes("iwantclips")) iwcStudios.push(id)
    else if (domain.includes("pornbox")) pornboxStudios.push(id)
    else if (domain.includes("mydirtyhobby")) mydirtyHobbyStudios.push(id)
    else if (domain.includes("vrporn")) vrpornStudios.push(id)
    else if (domain == "web.archive.org" || domain == "www.iafd.com" || domain == "www.data18.com") return 
    else {
      studioMap.set(id, url)
      if (!domainMap.has(domain)) domainMap.set(domain, 1)
      else domainMap.set(domain, domainMap.get(domain) + 1)
    }
  })
  // filter domainMap
  const filteredDomainMap = new Map([...domainMap].filter(([_, v]) => v > 1))
  console.log(filteredDomainMap)
  // dump to file
  fs.writeFileSync("amateur-site/results/studios.json", JSON.stringify([...studioMap], null, 2))
  arrToFile("pornhub-studios",pornhubStudios)
  arrToFile("xvideos-studios",xvideoStudio)
  arrToFile("slr-studios",slrStudios)
  arrToFile("c4s-studios",c4sStudios)
  arrToFile("mv-studios",mvStudios)
  arrToFile("no-url-studios",noURLStudios)
  arrToFile("analvids-studios",analvidsStudios)
  arrToFile("iwc-studios",iwcStudios)
  arrToFile("pornbox-studios",pornboxStudios)
  arrToFile("mydirtyhobby-studios",mydirtyHobbyStudios)
  arrToFile("vrporn-studios",vrpornStudios)
}
reprocess()