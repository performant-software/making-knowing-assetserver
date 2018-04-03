
// TEST module for trying out search index
// run node and then:
// const searchEdition = require('./search_edition.js')
// searchEdition(searchTerm)

const fs = require('fs');
const lunr = require('lunr');

const webRoot = "../../nginx/webroot";
// const webRoot = "TEMP/testindex";
const searchIndexFile = `${webRoot}/search_index.js`;
const recipeBookFile = `${webRoot}/recipe_book.js`;

function searchEdition( searchTerm ) {

  // make sure the folio dir exists
  if( !fs.existsSync(searchIndexFile) ) {
    console.log("Search index not found.");
    return null;
  }

  let searchIndexJSON = fs.readFileSync(searchIndexFile, "utf8");
  let searchIndex = lunr.Index.load(JSON.parse(searchIndexJSON));
  let recipeBook = JSON.parse(fs.readFileSync(recipeBookFile, "utf8"));

  let results = searchIndex.search(searchTerm);
  let recipes = [];
  for( let result of results ) {
    // TODO pull a window of text out of the content to display with the search result
    // r1.result.matchData.metadata.coral.content.position
    recipes.push( { recipe: recipeBook[ result.ref ], result: result } );
  }

  return recipes;
}

module.exports = searchEdition;
