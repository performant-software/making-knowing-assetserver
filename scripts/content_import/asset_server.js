const fs = require('fs');

const searchIndex = require('./search_index');
const convert = require('./convert');

function copyFolioXMLs( inputDir, folioPath ) {
  // TODO
}

function dirExists( dir ) {
  if( !fs.existsSync(dir) ) {
    fs.mkdirSync(dir);
    if( !fs.existsSync(dir) ) {
      console.log(`${dir} not found and unable to create it.`);
      return false;
    }
  }  
  return true;
}

function main() {

  // make sure the necessary dirs exist
  const inputDir = 'scripts/content_import/TEMP/input';
  const folioPath = 'nginx/webroot/folio';
  const searchIndexPath = 'nginx/webroot/search-idx';
  if( !fs.existsSync(inputDir) || !dirExists(folioPath) || !dirExists(searchIndexPath) ) {
    console.log('Unable to start asset server.');
    return;
  }

  console.log('Copy all the folios to the web directory...');
  copyFolioXMLs( inputDir, folioPath )

  console.log('Convert folios to HTML...');
  convert.convertFolios(folioPath);

  console.log('Generate Search Index...');
  searchIndex.generate(folioPath, searchIndexPath);
}

main();

// const waitTimeLengthMins = 20;

// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// function nextInterval() {
//     const now = new Date();
//     console.log( `time: ${now.toString()}`);
//     const nextIntervalMins = waitTimeLengthMins - (now.getMinutes() % waitTimeLengthMins);
//     const nextIntervalMs = (nextIntervalMins * 60) * 1000;
//     return nextIntervalMs;
// }
  
// async function main() {
//     while(true) {
//         console.log('Generating Search Index...');
//         searchIndex.generate('../nginx/webroot');    
//         await sleep(nextInterval());
//     }
// }
  