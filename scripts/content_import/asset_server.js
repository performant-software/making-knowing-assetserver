const fs = require('fs');
const { execSync } = require('child_process');

const searchIndex = require('./search_index');
const convert = require('./convert');

const waitTimeLengthMins = 1;
// const googleShareName="\"__Manuscript\ Pages\"";
const googleShareName="\"BnF\ Ms\ Fr\ 640/__Manuscript\ Pages\"";
// const rcloneConfigFile="/root/.config/rclone/rclone.conf";

const transcriptionTypes = [
  'tc', 'tcn', 'tl'
];

function downloadFiles(inputDir) {
  execSync(`rclone --drive-formats txt -v --drive-shared-with-me sync google:${googleShareName} ${inputDir}`, (error, stdout, stderr) => {
    console.log(`${stdout}`);
    console.log(`${stderr}`);
    if (error !== null) {
        console.log(`exec error: ${error}`);
    }
  });  
}

function clearLogFile() {
  execSync(`rm nginx/webroot/logfile.txt`, (error, stdout, stderr) => {
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
    return new Promise(resolve => setTimeout(resolve, ms));
}

function nextInterval() {
    const now = new Date();
    const nextIntervalMins = waitTimeLengthMins - (now.getMinutes() % waitTimeLengthMins);
    const nextIntervalMs = (nextIntervalMins * 60) * 1000;
    return nextIntervalMs;
}

async function main() {

  // make sure the necessary dirs exist
  const inputDir = 'scripts/content_import/TEMP/input';
  const folioPath = 'nginx/webroot/folio';
  const searchIndexPath = 'nginx/webroot/search-idx';
  if( !fs.existsSync(inputDir) || !dirExists(folioPath) || !dirExists(searchIndexPath) ) {
    console.log('Unable to start asset server.');
    return;
  }

  const now = new Date();
  console.log( `Asset Pipeline started at: ${now.toString()}`);

  console.log('Download files from Google Drive...');
  downloadFiles(inputDir);

  console.log('Copy all the folios to the web directory...');
  copyFolioXMLs( inputDir, folioPath )

  console.log('Convert folios to HTML...');
  convert.convertFolios(folioPath);

  console.log('Generate Search Index...');
  searchIndex.generate(folioPath, searchIndexPath);

  clearLogFile();
}

main();