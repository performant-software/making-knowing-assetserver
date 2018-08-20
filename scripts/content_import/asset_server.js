const searchIndex = require('./search_index');
const convert = require('./convert');
const fs = require('fs');

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

  // make sure the folio dir exists
  const folioPath = 'nginx/webroot/folio';
  const searchIndexPath = 'nginx/webroot/search-idx';
  if( !dirExists(folioPath) || !dirExists(searchIndexPath) ) {
    return;
  }

  // convert all the folios
  console.log('Converting folios...');
  // convert.convertFolios(folioPath);

  console.log('Generating Search Index...');
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
  