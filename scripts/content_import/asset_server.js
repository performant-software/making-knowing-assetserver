const fs = require('fs');
const { execSync } = require('child_process');

const searchIndex = require('./search_index');
const convert = require('./convert');

const waitTimeLengthMins = 1;

const transcriptionTypes = [
  'tc', 'tcn', 'tl'
];

function downloadFiles(inputDir) {

  // if folder is empty, clone repository. otherwise pull from repo
  if( fs.readdirSync(inputDir).length === 0 ) {
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
  const inputDir = `${pullDir}/ms-xml`;

  const listDir = fs.readdirSync(`${pullDir}/ms-xml/tc`);

  listDir.forEach( page => {
    // extract folio ID
    const matches = page.match(/p[0-9]{3}[vr]/);
    // make sure there are no other files that aren't pages
    const folioID = matches ? matches[0] : null;

    if(folioID) {
      const targetDir = `${orderedDir}/${folioID}`;

      if( dirExists(targetDir) ) {
        transcriptionTypes.forEach( transcriptionType => {
          const sourceFile = `${inputDir}/${transcriptionType}/${transcriptionType}_${folioID}_preTEI.xml`;
          if(fs.existsSync(sourceFile)) {
            const targetFile = `${targetDir}/${transcriptionType}_${folioID}.txt`;
            fs.copyFileSync(sourceFile, targetFile);
          }
        });
      }
    }
  });
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
  const correctFormatDir = 'scripts/content_import/TEMP/sorted-input';
  const folioPath = 'nginx/webroot/folio';
  const searchIndexPath = 'nginx/webroot/search-idx';
  if( !dirExists(folioPath) || !dirExists(searchIndexPath) || !dirExists(correctFormatDir) || !dirExists(inputDir) ) {
    console.log('Unable to start asset server.');
    return;
  }

  // Start fresh each run
  //clearLogFile();

  const now = new Date();
  console.log( `Asset Pipeline started at: ${now.toString()}`);

  console.log('Download files from Github...');
  downloadFiles(inputDir);

  console.log('Reorganize files...');
  reorganizeFiles(inputDir, correctFormatDir);

  console.log('Copy all the folios to the web directory...');
  copyFolioXMLs( correctFormatDir, folioPath );

  console.log('Convert folios to HTML...');
  convert.convertFolios(folioPath);

  console.log('Generate Search Index...');
  searchIndex.generate(folioPath, searchIndexPath);

  console.log('sleeping');
  sleep(nextInterval());

}

main();
