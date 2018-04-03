const fs = require('fs');
const lunr = require('lunr');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const webRoot = "../../nginx/webroot";
// const webRoot = "TEMP/testindex";
const folioDir = `${webRoot}/folio`;
const searchIndexFile = `${webRoot}/search_index.js`;
const recipeBookFile = `${webRoot}/recipe_book.js`;

function parseFolio(html, folioID) {
  let dom = new JSDOM(html);
  let htmlDoc = dom.window.document;

  let folio = htmlDoc.querySelector('folio');
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

function main() {

  // make sure the folio dir exists
  if( !fs.existsSync(folioDir) ) {
    console.log("Folio directory not found.");
    return;
  }

  var recipeBook = {};

  // open an index for writing, output to webroot dir
  var searchIndex = lunr(function () {
    this.ref('id')
    this.field('folioID')
    this.field('name')
    this.field('content')
    this.metadataWhitelist = ['position'];

    let folios = fs.readdirSync(folioDir);
    folios.forEach( folio => {

      // ignore hidden directories
      if( folio.startsWith('.') ) return;

      // ignore the manifest file
      if( folio.startsWith('manifest') ) return;

      // get contents of folio file
      // let tcHTML = fs.readFileSync(`${folioDir}/${folio}/tc/index.html`, "utf8");
      let tlHTML = fs.readFileSync(`${folioDir}/${folio}/tl/index.html`, "utf8");

      // TODO
      // pull html from each of the three subfolders
      // index tc and tcn in french, tl in english

      let recipes = parseFolio(tlHTML,folio);
      for( let recipe of recipes ) {
        this.add(recipe);
        if( recipe.name ) {
          recipeBook[recipe.id] = recipe;
        }
      }

    }, this);
  });

  // write index to file
  fs.writeFile(searchIndexFile, JSON.stringify(searchIndex), (err) => {
    if (err) throw err;
  });

  // write the recipe file
  fs.writeFile(recipeBookFile, JSON.stringify(recipeBook), (err) => {
    if (err) throw err;
  });

}

///// RUN THE SCRIPT
main();
