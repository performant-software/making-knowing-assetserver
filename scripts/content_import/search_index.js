const fs = require('fs');

// load lunr with fr support
var lunr = require('lunr');
require("lunr-languages/lunr.stemmer.support")(lunr)
require('lunr-languages/lunr.multi')(lunr)
require("lunr-languages/lunr.fr")(lunr)

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const searchIndexDir = "search-idx";
const folioDir = "folio";

function parseFolio(html) {
  let dom = new JSDOM(html);
  let htmlDoc = dom.window.document;

  let folio = htmlDoc.querySelector('folio');

  if( folio === null ) return [];

  let recipeDivs = folio.children;
  let passages = [];
  for (let i = 0; i < recipeDivs.length; i++) {
    let recipeDiv = recipeDivs[i];
    let recipeID = recipeDiv.id;
    if( recipeID ) {
      let headerElement = recipeDiv.querySelector("h2")
      let name = ( headerElement ) ? headerElement.textContent : null;
      let content = recipeDiv.textContent;
      passages.push({
        recipeID: recipeID,
        name: name,
        content: content
      });
    }
  }

  return passages;
}

function createSearchIndex( folioPath, indexPath, transcriptionType ) {

  var recipeBook = {};

  // open an index for writing, output to searchIndexDir dir
  var searchIndex = lunr(function () {
    this.use(lunr.multiLanguage('en', 'fr'))
    this.ref('id')
    this.field('content')
    this.metadataWhitelist = ['position'];

    let folios = fs.readdirSync(folioPath);
    folios.forEach( folioID => {

      // ignore hidden directories
      if( folioID.startsWith('.') ) return;

      // ignore the manifest file
      if( folioID.startsWith('manifest') ) return;

      let folioHTMLFile = `${folioPath}/${folioID}/${transcriptionType}/index.html`;

      // make sure the folio file exists
      if( fs.existsSync(folioHTMLFile) ) {
        const html = fs.readFileSync( folioHTMLFile, "utf8");
        const passages = parseFolio(html);

        for( let passage of passages ) {
          // create a search index document
          const passageRecord = { 
            id: `${passage.recipeID}-${folioID}`,
            content: passage.content
          };

          // add record to lunr index
          this.add( passageRecord );

          let recipe = recipeBook[passage.recipeID];
          if( !recipe ) {
            // create a new recipe entry
            recipe = {
              id: passage.recipeID,
              name: 'ERROR: Unable to parse name.',
              passages: {} 
            };
            recipeBook[passage.recipeID] = recipe;
          } 
          if( passage.name ) recipe.name = passage.name;
          recipe.passages[folioID] = passageRecord.content;
        }
      }

    }, this);
  });

  let searchIndexFile = `${indexPath}/${transcriptionType}_search_index.js`;
  let recipeBookFile = `${indexPath}/${transcriptionType}_recipe_book.js`;

  // write index to file
  fs.writeFileSync(searchIndexFile, JSON.stringify(searchIndex), (err) => {
    if (err) throw err;
  });


  // write the recipe file
  fs.writeFileSync(recipeBookFile, JSON.stringify(recipeBook), (err) => {
    if (err) throw err;
  });
}

var generate = function generate(destDir) {

  let folioPath = `${destDir}/${folioDir}`
  let indexPath = `${destDir}/${searchIndexDir}`

  // make sure the folio dir exists
  if( !fs.existsSync(folioPath) ) {
    console.log("Folio directory not found.");
    return;
  }

  // make sure the index dir exists
  if( !fs.existsSync(indexPath) ) {
    console.log("Index directory not found.");
    return;
  }
  
  createSearchIndex(folioPath, indexPath, 'tl');
  createSearchIndex(folioPath, indexPath, 'tc');
  createSearchIndex(folioPath, indexPath, 'tcn');
}

// EXPORTS /////////////
module.exports.generate = generate;