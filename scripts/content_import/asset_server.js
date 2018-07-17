const searchIndex = require('./search_index');

const waitTimeLengthMins = 20;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function nextInterval() {
    const now = new Date();
    console.log( `time: ${now.toString()}`);
    const nextIntervalMins = waitTimeLengthMins - (now.getMinutes() % waitTimeLengthMins);
    const nextIntervalMs = (nextIntervalMins * 60) * 1000;
    return nextIntervalMs;
}
  
async function main() {
    while(true) {
        console.log('Generating Search Index...');
        searchIndex.generate('../nginx/webroot');    
        await sleep(nextInterval());
    }
}
  
main();