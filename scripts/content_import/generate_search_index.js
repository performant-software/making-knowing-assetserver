const fs = require('fs');
const lunr = require('lunr');

// const webRoot = "../../nginx/webroot";
const webRoot = "TEMP/testindex";
const folioDir = `${webRoot}/folio`;
const searchIndexFile = `${webRoot}/searchIndex.js`;


// returns transcription or null if unable to parse
function parseTranscription(html) {

  // pull transcription from folio element
  let folioTag = "<folio";
  let openDivIndex = html.indexOf(folioTag);
  if (openDivIndex === -1) return null;
  let start = html.indexOf(">", openDivIndex) + 1;
  let end = html.lastIndexOf("</folio>");
  if (end === -1) return null;
  if (start >= end) return null;
  let transcription = html.slice(start, end);

  // drop tags in transcription
  let content = transcription.replace(/<[^>]*>/g, '');

  return content;
}

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

      // ignore hidden directories
      if( folio.startsWith('.') ) return;

      // get contents of folio file
      let tcHTML = fs.readFileSync(`${folioDir}/${folio}/tc/index.html`, "utf8");

      // TODO
      // pull html from each of the three subfolders
      // index tc and tcn in french, tl in english

      // grab just the contents of folio element and then strip all tags from that
      let folioContent = parseTranscription(tcHTML);

      let folioDocument = {
        id: folio,
        content: folioContent
      }

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
