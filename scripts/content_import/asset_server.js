const fs = require('fs');
const { execSync } = require('child_process');

const searchIndex = require('./search_index');
const convert = require('./convert');

const waitTimeLengthMins = 1;

const transcriptionTypes = [
  'tc', 'tcn', 'tl'
];

function downloadFiles(inputDir) {
  console.log('downloading');

  if( !fs.existsSync(inputDir) ) {
    execSync(`git clone https://github.com/performant-software/m-k-manuscript-data.git ${inputDir}`, (error, stdout, stderr) => {
      console.log(`${stdout}`);
      console.log(`${stderr}`);
      if (error !== null) {
          console.log(`exec error: ${error}`);
      }
    });
  } else {
    execSync(`git -C ${inputDir} pull`, (error, stdout, stderr) => {
      console.log(`${stdout}`);
      console.log(`${stderr}`);
      if (error !== null) {
          console.log(`exec error: ${error}`);
      }
    });
  }
}

function reorganizeFiles(pullDir, orderedDir) {
  //TODO
}

function clearLogFile() {
  const logFile = "nginx/webroot/logfile.txt";
  if( fs.existsSync(logFile) )
  execSync(`rm ${logFile}`, (error, stdout, stderr) => {
    console.log(`${stdout}`);
    console.log(`${stderr}`);
    if (error !== null) {
        console.log(`exec error: ${error}`);
    }
  });
}

function copyFolioXMLs( sourcePath, folioPath ) {
  const inputDir = fs.readdirSync(sourcePath);
  inputDir.forEach( folioFolder => {
    // ignore hidden directories
    if( folioFolder.startsWith('.') ) return;

    // extract the folio ID from the folder name
    const matches = folioFolder.match(/p[0-9]{3}[vr]/);
    const folioID = matches ? matches[0] : null;

    if( folioID ) {
      const targetDir = `${folioPath}/${folioID}`;

      // create a dir for folio if necessary
      if( dirExists(targetDir) ) {
        transcriptionTypes.forEach( transcriptionType => {
          const sourceFile = `${sourcePath}/${folioFolder}/${transcriptionType}_${folioID}.txt`;
          const ttDir = `${targetDir}/${transcriptionType}`;
          // always create the dir even if source file not found.
          if( dirExists(ttDir) ) {
            if( fs.existsSync(sourceFile) ) {
              const targetFile = `${ttDir}/original.txt`;
              fs.copyFileSync(sourceFile, targetFile);
            }
          }
        });
      }
    }
  });
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

function sleep(ms) {
    console.log('sleeping');
    return new Promise(resolve => setTimeout(resolve, ms));
}

function nextInterval() {
    const now = new Date();
    const nextIntervalMins = waitTimeLengthMins - (now.getMinutes() % waitTimeLengthMins);
    const nextIntervalMs = (nextIntervalMins * 60) * 1000;
    console.log(nextIntervalMs);
    return nextIntervalMs;
}

async function main() {

  // make sure the necessary dirs exist, EXCEPT:
  // CONDITION: when server is started, inputDir must not exist
  const inputDir = 'scripts/content_import/TEMP/input';

  const folioPath = 'nginx/webroot/folio';
  const searchIndexPath = 'nginx/webroot/search-idx';
  if( !dirExists(folioPath) || !dirExists(searchIndexPath) ) {
    console.log('Unable to start asset server.');
    return;
  }

  // Start fresh each run
  //clearLogFile();

  const now = new Date();
  console.log( `Asset Pipeline started at: ${now.toString()}`);

  console.log('Download files from Github...');
  downloadFiles(inputDir);

  //sleep(nextInterval());

  /*

  console.log('Copy all the folios to the web directory...');
  copyFolioXMLs( inputDir, folioPath )

  console.log('Convert folios to HTML...');
  convert.convertFolios(folioPath);

  console.log('Generate Search Index...');
  searchIndex.generate(folioPath, searchIndexPath);

  */

}

main();
