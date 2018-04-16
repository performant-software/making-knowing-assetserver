
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

const MAX_FRAGMENT_LENGTH = 60;

function highlightFragment( contentFragment, termStart, termEnd ) {
  // TODO add a highlight span
  return contentFragment;
}

// pull a window of text out of the content to display with the search result
function contextFragments( resultMetadata, fullText ) {
  let highlightedFragments = [];

  for( let keyword of Object.keys(resultMetadata) ) {
    let keywordData = resultMetadata[keyword];
    for( let highlightPosition of keywordData.content.position ) {
      let highlightedFragment;
      if( fullText.length > MAX_FRAGMENT_LENGTH ) {
        let termStart = highlightPosition[0] ;
        let termEnd = highlightPosition[1];
        let termCenter = (termEnd-termStart)/2 + termStart;
        let fragStart = termCenter-(MAX_FRAGMENT_LENGTH/2);
        let fragEnd = fragStart + MAX_FRAGMENT_LENGTH;
        fragStart = (fragStart < 0) ? 0 : fragStart;
        fragEnd = (fragEnd > fullText.length) ? fullText.length : fragEnd;
        let contentFragment = fullText.slice( fragStart, fragEnd );
        termStart = termStart - fragStart;
        termEnd = termEnd - fragStart;
        highlightedFragment = highlightFragment( contentFragment, termStart, termEnd );
      } else {
        highlightedFragment = highlightFragment( fullText, ...highlightPosition );
      }
      highlightedFragments.push(highlightedFragment);
    }
  }

  return highlightedFragments;
}

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
    let recipe = recipeBook[ result.ref ];
    let fragments = contextFragments( result.matchData.metadata, recipe.content )
    recipes.push( { name: recipe.name, folio: recipe.folioID, contextFragments: fragments } );
  }

  return recipes;
}

module.exports = searchEdition;
