const fs = require('fs');
const lunr = require('lunr');

// const webRoot = "../../nginx/webroot";
const webRoot = "TEMP/testindex";
const folioDir = `${webRoot}/folio`;
const searchIndexFile = `${webRoot}/searchIndex.js`;

function main() {

  // make sure the folio dir exists
  if( !fs.existsSync(folioDir) ) {
    console.log("Folio directory not found.");
    return;
  }

  // open an index for writing, output to webroot dir
  var searchIndex = lunr(function () {
    this.ref('id')
    this.field('content')

    let folios = fs.readdirSync(folioDir);
    folios.forEach( folio => {

      // get contents of folio file
      let tcHTML = fs.readFileSync(`${folioDir}/${folio}/tc/index.html`, "utf8");

      // grab just the contents of folio element and then strip all tags from that
      let folioContent =

      let folioDocument = {
        id: folio,
        content: folioContent
      }

      // TODO
      // pull html from each of the three subfolders
      // index tc and tcn in french, tl in english

      this.add(folioDocument);

    }, this);
  });

  // write index to file
  fs.writeFile(searchIndexFile, JSON.stringify(searchIndex), (err) => {
    if (err) throw err;
  });

}

///// RUN THE SCRIPT
main();
