import axios from 'axios'
import 'dotenv/config'

// query fragments
const findScene = `
  query ($id: ID!) {
  findScene(id: $id) {
    title date production_date
    details director duration code
    urls {
      url
      site { id }
    }
    studio { id }
    tags { id }
    images { id }
    edits { status }
    performers {
      performer { id }
    }}}`

const getTag = `
query ($page: Int!, $tag: [ID!]) {
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
    }}}
`

// plugins/stashdb-api
export const callGQL = async (reqData) =>
  axios({
    url: "https://stashdb.org/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ApiKey": process.env.STASHDB_API_KEY,
    },
    data: JSON.stringify(reqData),
  })
    .then((res) => res.data.data)
    .catch((err) => {
      console.log("Error")
      console.log(err)
      console.log(JSON.stringify(err?.response?.data))
    })

export const paginatedFetch = async (reqData) => {
  const results = []
  let page = 1
  // fetch first page and count
  const firstPage = await callGQL({ ...reqData, variables: { ...reqData.variables, page } })
  const queryName = Object.keys(firstPage)[0]
  const dataObj = Object.keys(firstPage[queryName])[1]
  // push first page
  results.push(...firstPage[queryName][dataObj])
  // get rest of pages
  const pageCount = Math.ceil(firstPage[queryName].count / 20)
  for (; page <= pageCount; page++) {
    console.log("Fetching page", page)
    const data = await callGQL({ ...reqData, variables: { ...reqData.variables, page } })
    results.push(...data[queryName][dataObj])
  }
  return results
}

export const tagFetch = (tag, page = 1) => callGQL({
  query: getTag,
  variables: { page, tag }
})

export const editScene = async (sceneID, badTag, newTag, comment) => {
  // get oldScene
  const oldScene = await callGQL({
    query: findScene,
    variables: { id: sceneID }
  })
  const scene = oldScene.findScene
  // if pending edit, exit
  for (const edit of scene.edits) {
    if (edit.status == "PENDING") {
      console.log("    ❌ Scene has pending edit")
      return
    }
  }
  // craft new edit request
  const tag_ids = scene.tags.map(tag => tag.id)
  const performers = scene.performers.map(performer => performer.performer.id)
  const image_ids = scene.images.map(image => image.id)
  const urls = scene.urls.map(url => ({ url: url.url, site_id: url.site.id }))
  const studio_id = scene.studio.id
  const badTagIndex = tag_ids.indexOf(badTag)
  if (badTagIndex === -1) {
    console.log("Tag not found")
    return
  }
  tag_ids.splice(badTagIndex, 1)
  tag_ids.push(newTag)
  const newScene = {
    ...scene,
    tag_ids,
    performers,
    image_ids,
    studio_id,
    urls
  }
  delete newScene.edits
  delete newScene.tags
  delete newScene.performers
  delete newScene.images
  delete newScene.studio
  // submit edit
  await callGQL({
    query: `mutation ($input: SceneEditInput!) {
      sceneEdit(input: $input) {
        id
      }}`,
    variables: { input: {
      edit: {
        id: sceneID,
        operation: "MODIFY",
        comment,
        bot: true
      }, details: newScene
    }}
  }).then(data => {
    const id = data.sceneEdit.id
    console.log(`    Edit created with id: ${id}`)
  }).catch(err => {
    console.log("Error")
    console.log(err)
    console.log(JSON.stringify(err?.response?.data))
  })
}