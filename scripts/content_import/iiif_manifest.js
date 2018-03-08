// Includes
const fs = require('fs');
const util = require('util');
const path = require('path');

var domainName = "http://localhost:4000"


function generateFolioID( bnfLabel ) {
  // grab r or v off the end
  let rectoOrVerso = bnfLabel.slice( bnfLabel.length-1 );
  let id = parseInt(bnfLabel.slice(0,bnfLabel.length-1));

  // the beginning and end pages do not have a numeric label
  if( isNaN(id) ) return null;

  // figure out how much padding we need
  let zeros = "";

  if( id < 10 ) {
    zeros = zeros + "0"
  }

  if( id < 100 ) {
    zeros = zeros + "0"
  }

  return `p${zeros.concat(id)}${rectoOrVerso}`;
}

// Add this to the manifest canvas entries:
// "otherContent" : [ {
//   "@id": "http://localhost:4000/bnf-ms-fr-640/list/p003r.json",
//   "@type": "sc:AnnotationList"
// }],

let json = fs.readFileSync("bnf_manifest.json", "utf8");
let manifest = JSON.parse(json);
let canvases = manifest["sequences"][0]["canvases"];

for( let canvas of canvases ) {
  let folioID = generateFolioID(canvas["label"]);

  if( folioID ) {
    let annotationListURL =  `${domainName}/bnf-ms-fr-640/list/${folioID}.json`;

    canvas["otherContent"] = [ {
      "@id": annotationListURL,
      "@type": "sc:AnnotationList"
    } ];
  }

  // since we're here, shouldn't we also write out the annotation files?
}

fs.writeFile('TEMP/manifest.json', JSON.stringify(manifest, null, 3), (err) => {
    if (err) {
      console.log(err);
    } else {
      // success case, the file was saved
      console.log('IIIF Manifest created.');
    };

});
