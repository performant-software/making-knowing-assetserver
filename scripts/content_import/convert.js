const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const transcriptionTypes = [
  'tc', 'tcn', 'tl'
];

const figuresDir = "/bnf-ms-fr-640/figures";

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

const hintCodes = [
  'tall',
  'extra-tall',
  'wide',
  'extra-wide'
];

const convertToSpan =[
  'al',
  'bp',
  'cn',
  'cont',
  'env',
  'fr',
  'gap',
  'df',
  'gk',
  'it',
  'ill',
  'la',
  'ms',
  'mu',
  'oc',
  'pa',
  'pl',
  'pm',
  'pn',
  'pro',
  'sn',
  'tl',
  'tmp',
  'unc',
  'x'
];

const filterOut = [
  'id',
  'margin',
  'render',
  'comment'
];

function validLayoutCode( layoutCode ) {
  if( marginCodes.includes(layoutCode) ) {
    return layoutCode;
  } else {
    return 'middle';
  }
};

function validLayoutHint( layoutHint ) {
  if( hintCodes.includes(layoutHint) ) {
    return layoutHint;
  } else {
    return null;
  }
}

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

function findAndRemoveElement( parent, elementName ) {
  let elements = parent.querySelectorAll( elementName );
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.remove();
  }
}

function findAndReplaceElementName( htmlDoc, parent, oldElementName, newElementName ) {
  let elements = parent.querySelectorAll( oldElementName );
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    let newEl = htmlDoc.createElement(newElementName);
    newEl.innerHTML = el.innerHTML;
    el.replaceWith(newEl);
  }
}

function convertPhraseLevelMarkup( htmlDoc, el, elementName ) {
  let newEl = htmlDoc.createElement(elementName);
  newEl.innerHTML = el.innerHTML;

  findAndReplaceElementName( htmlDoc, newEl, 'LB', 'BR' );
  findAndReplaceElementName( htmlDoc, newEl, 'DEL', 'S' );

  for( let tag of convertToSpan ) {
    findAndReplaceElementName( htmlDoc, newEl, tag, 'SPAN' );
  }

  return newEl;
}

function convertAB( htmlDoc, ab ) {
  let abDiv = convertPhraseLevelMarkup( htmlDoc, ab, 'div' );
  abDiv.dataset.layout = validLayoutCode( findDataElement( ab, 'margin' ) );
  const layoutHint = validLayoutHint( findDataElement( ab, 'render') );
  if( layoutHint ) {
    abDiv.dataset.layoutHint = layoutHint;
  }
  return abDiv;
}

function convertHead( htmlDoc, head ) {
  let h2Div = convertPhraseLevelMarkup( htmlDoc, head, 'h2' );
  return h2Div;
}

function convertFigure( htmlDoc, figure ) {
  let figureID = findDataElement( figure, 'id' );
  let figureURL = ( figureID ) ? `${figuresDir}/${figureID.substr(4)}.png` : null;
  let figDiv = htmlDoc.createElement('div');
  figDiv.id = findDataElement( figure, 'id' );
  figDiv.dataset.layout = validLayoutCode( findDataElement( figure, 'margin' ) );
  figDiv.innerHTML = ( figureURL ) ?  `<img alt='' className='inline-figure' src='${figureURL}'/>` : "";
  return figDiv;
}

function convertCont( htmlDoc, cont ) {
  let contDiv = htmlDoc.createElement('div');
  contDiv.innerHTML = "<i>Continued...</i>";
  return contDiv;
}

// remove footnotes produced by Google Drive export to plain text
function squashFootnotes(xml) {
  // remove the footnote itself
  xml = xml.replace(/^\[[a-z]\].*$/gm,'');
  // remove the footnote marker from text body
  return xml.replace(/\[[a-z]\]/gm,'');
}

function convertXML(xml, fileID) {
  xml = squashFootnotes(xml);
  let xmlDOM = new JSDOM(`<xml>${xml}</xml>`, { contentType: "text/xml" });
  let xmlDoc = xmlDOM.window.document;

  // create a parallel HTML DOM and move elements from xml dom to html
  let htmlDOM = new JSDOM( htmlTemplate(fileID) );
  let htmlDoc = htmlDOM.window.document;

  let folio = htmlDoc.querySelector('folio');
  let divs = xmlDoc.querySelectorAll('div');

  for( let div of divs ) {
    let zoneDiv = htmlDoc.createElement('div');
    zoneDiv.id = findDataElement( div, 'id' );

    for( let child of div.children ) {
      if( child.nodeName === 'ab') {
        zoneDiv.appendChild( convertAB(htmlDoc, child) );
      }
      else if( child.nodeName === 'figure' ) {
        zoneDiv.appendChild( convertFigure(htmlDoc, child) );
      }
      else if( child.nodeName === 'head' ) {
        zoneDiv.appendChild( convertHead(htmlDoc, child) );
      }
      else if( child.nodeName === 'cont' ) {
        zoneDiv.appendChild( convertCont(htmlDoc, child) );
      }
    }

    // filter out certain tags
    for( let tag of filterOut ) {
      findAndRemoveElement( zoneDiv, tag );
    }

    // create a zone in the htmlDOM
    folio.appendChild(zoneDiv);
  }

  return htmlDOM.serialize();
}

function convertFile( folioID, transcriptionType, xmlFile, htmlFile ) {
  const fileID = `${transcriptionType}_${folioID}`;
  if( !fs.existsSync(xmlFile) ) {
    const err = `Transcription file not found: ${fileID}`;
    fs.writeFileSync(htmlFile, errorMessage(err));
    console.log(err);
    return;
  }

  try {
    const xml = fs.readFileSync( xmlFile, "utf8");
    const html = convertXML(xml,fileID);
    fs.writeFileSync(htmlFile, html);
  } catch (err) {
    const errorMsg = errorMessage(err.toString());
    fs.writeFileSync(htmlFile, errorMsg);
    console.log(`Error converting: ${fileID}`);
  }
}

function convertFolios( folioPath ) {
  const folios = fs.readdirSync(folioPath);
  folios.forEach( folioID => {
    // ignore hidden directories
    if( folioID.startsWith('.') ) return;

    // ignore the manifest file
    if( folioID.startsWith('manifest') ) return;

    transcriptionTypes.forEach( transcriptionType => {
      const folioOriginalXML = `${folioPath}/${folioID}/${transcriptionType}/original.txt`;
      const folioHTML = `${folioPath}/${folioID}/${transcriptionType}/index.html`;
      convertFile(folioID, transcriptionType, folioOriginalXML, folioHTML);
    });
  });
}


// EXPORTS /////////////
module.exports.convertFolios = convertFolios;
