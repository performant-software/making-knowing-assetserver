const argv = require('yargs').argv;
const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const marginCodes = [
  'middle',
  'top',
  'left-middle',
  'right-middle',
  'bottom',
  'left-top',
  'right-top',
  'left-bottom',
  'right-bottom'
];

function validLayoutCode( layoutCode ) {
  if( marginCodes.includes(layoutCode) ) {
    return layoutCode;
  } else {
    return 'middle';
  }
};

function htmlTemplate(xmlFilename) {
  // set title to the folio id
  let docTitle = path.basename(xmlFilename).split(".")[0];

  let template = '<!DOCTYPE html>';
  template +=	'<html>';
  template += 		'<head>';
  template += 			'<meta charset="utf-8"/>';
  template += 			'<title>'+docTitle+'</title>';
  template += 		'</head>';
  template += 		'<body>';
  template +=			'<folio layout=\"margin\">';
  template +=			'</folio>';
  template += 		'</body>';
  template +=	'</html>';
  return template;
}

function errorMessage(errorMessage) {
  errorMessage = errorMessage.replace(/\n/g,'<br/>');
  let template = '<!DOCTYPE html>';
  template +=	'<html>';
  template += 		'<head>';
  template += 			'<meta charset="utf-8"/>';
  template += 			'<title>Parsing Error</title>';
  template += 		'</head>';
  template += 		'<body>';
  template +=			'<folio layout=\"margin\">';
  template +=	      '<div id="error">';
  template +=	       '<h2>Error Parsing Transcription</h2>';
  template +=	       '<div data-layout="middle">'+errorMessage+'</div>';
  template +=	      '</div>';
  template +=			'</folio>';
  template += 		'</body>';
  template +=	'</html>';
  return template;
}

function findDataElement( parent, elementName ) {
  for( let child of parent.children ) {
    if( child.nodeName === elementName ) {
      return child.innerHTML;
    } 
  }
  return null;
}

function findAndReplaceElementName( htmlDoc, parent, oldElementName, newElementName ) {
  for( let child of parent.children ) {    
    if( child.nodeName === oldElementName ) {
      let newEl = htmlDoc.createElement(newElementName);
      newEl.innerHTML = child.innerHTML;
      child.replaceWith(newEl);
    } 
  }
}

function convert(xmlFilename) {
  // load the xml file into DOM
  let xml = fs.readFileSync(xmlFilename, "utf8");
  let xmlDOM = new JSDOM(`<xml>${xml}</xml>`, { contentType: "text/xml" });
  let xmlDoc = xmlDOM.window.document;

  // create a parallel HTML DOM and move elements from xml dom to html
  let htmlDOM = new JSDOM( htmlTemplate(xmlFilename) );
  let htmlDoc = htmlDOM.window.document;

  let folio = htmlDoc.querySelector('folio');
  let divs = xmlDoc.querySelectorAll('div');

  for( let div of divs ) {  
    let zoneDiv = htmlDoc.createElement('div');
    zoneDiv.id = findDataElement( div, 'id' );

    for( let child of div.children ) {
      if( child.nodeName === 'ab') {
        let abDiv = htmlDoc.createElement('div');
        abDiv.dataset.layout = validLayoutCode( findDataElement( child, 'margin' ) );        
        abDiv.innerHTML = child.innerHTML;
        findAndReplaceElementName( htmlDoc, abDiv, 'LB', 'BR' );
        zoneDiv.appendChild(abDiv);
      } 
      else if( child.nodeName === 'figure' ) {
        // TODO convert figures to divs
      } else if( child.nodeName === 'head' ) {
        let h2Div = htmlDoc.createElement('h2');
        h2Div.innerHTML = child.innerHTML;
        zoneDiv.appendChild(h2Div);
      }

      // TODO convert cont 
    }

    // create a zone in the htmlDOM
    folio.appendChild(zoneDiv);
  }

  return htmlDOM.serialize();
}

function main() {
  // Params provided?
  if ((typeof argv.src == "undefined")) {
    console.log("Usage: convert --src /path/to/xml");
    process.exit();
  }

  try {
    let xmlFilename = argv.src;
    let html = convert(xmlFilename);
    console.log(html);     
  }
  catch (e) {
    // if things didn't work out, return an error page.
    console.log(errorMessage(e.toString()));
  }

}

///// RUN THE SCRIPT
main();
