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

function parseFolio(folioID, html) {
  let dom = new JSDOM(html);
  let htmlDoc = dom.window.document;

  let folio = htmlDoc.querySelector('folio');

  if( folio === null ) return [];

  let recipeDivs = folio.children;
  let recipes = [];
  for (let i = 0; i < recipeDivs.length; i++) {
    let recipeDiv = recipeDivs[i];
    let id = recipeDiv.id;
    if( id ) {
      let headerElement = recipeDiv.querySelector("h2")
      let name = ( headerElement ) ? headerElement.textContent : null;
      let content = recipeDiv.textContent;
      recipes.push({
        id: id,
        folioID: folioID,
        name: name,
        content: content
      });
    }
  }

  return recipes;
}

function createSearchIndex( folioPath, indexPath, transcriptionType ) {

  var recipeBook = {};

  // open an index for writing, output to searchIndexDir dir
  var searchIndex = lunr(function () {
    this.use(lunr.multiLanguage('en', 'fr'))
    this.ref('id')
    this.field('folioID')
    this.field('name')
    this.field('content')
    this.metadataWhitelist = ['position'];

    let folios = fs.readdirSync(folioPath);
    folios.forEach( folio => {

      // ignore hidden directories
      if( folio.startsWith('.') ) return;

      // ignore the manifest file
      if( folio.startsWith('manifest') ) return;

      let folioHTMLFile = `${folioPath}/${folio}/${transcriptionType}/index.html`;

      // make sure the folio file exists
      if( fs.existsSync(folioHTMLFile) ) {
        let html = fs.readFileSync( folioHTMLFile, "utf8");
        let recipes = parseFolio(folio, html);
        for( let recipe of recipes ) {
          this.add(recipe);
          if( recipe.name ) {
            recipeBook[recipe.id] = recipe;
          }
        }
      }

    }, this);
  });

  let searchIndexFile = `${indexPath}/${transcriptionType}_search_index.js`;
  let recipeBookFile = `${indexPath}/${transcriptionType}_recipe_book.js`;

  // write index to file
  fs.writeFile(searchIndexFile, JSON.stringify(searchIndex), (err) => {
    if (err) throw err;
  });


  // write the recipe file
  fs.writeFile(recipeBookFile, JSON.stringify(recipeBook), (err) => {
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