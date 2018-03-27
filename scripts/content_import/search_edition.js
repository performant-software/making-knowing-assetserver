
// TEST module for trying out search index
// run node and then:
// const searchEdition = require('./search_edition.js')
// searchEdition(searchTerm)

const fs = require('fs');
const lunr = require('lunr');

// const webRoot = "../../nginx/webroot";
const webRoot = "TEMP/testindex";
const searchIndexFile = `${webRoot}/searchIndex.js`;

function searchEdition( searchTerm ) {

  // make sure the folio dir exists
  if( !fs.existsSync(searchIndexFile) ) {
    console.log("Search index not found.");
    return null;
  }

  let searchIndexJSON = fs.readFileSync(searchIndexFile, "utf8");
  let searchIndex = lunr.Index.load(JSON.parse(searchIndexJSON));
  return searchIndex.search(searchTerm);
}

module.exports = searchEdition;
