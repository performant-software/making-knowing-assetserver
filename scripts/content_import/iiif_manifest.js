// Includes
const fs = require('fs');
const util = require('util');
const path = require('path');

var domainName = "http://localhost:4000"

// Add this to the manifest canvas entries:
// "otherContent" : [ {
//   "@id": "http://localhost:4000/bnf-ms-fr-640/list/p003r.json",
//   "@type": "sc:AnnotationList"
// }],

let json = fs.readFileSync("bnf_manifest.json", "utf8");
let manifest = JSON.parse(json);
let canvases = manifest["sequences"][0]["canvases"];

for( let canvas of canvases ) {
  let canvasLabel = canvas["label"];

  // how many zeros?
  // what about pages that aren't numbered?

  let folioID = `p00${canvasLabel}`;
  let annotationListURL = `${domainName}/bnf-ms-fr-640/list/${folioID}.json`;

  canvas["otherContent"] = [ {
    "@id": annotationListURL,
    "@type": "sc:AnnotationList"
  } ];

  // since we're here, shouldn't we also write out the annotation files?
}

console.log( manifest );
