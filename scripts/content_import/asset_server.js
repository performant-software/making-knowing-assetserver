const searchIndex = require('./search_index');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  
async function main() {
    const waitTimeMinutes = 20;
    const waitTimeMs = (waitTimeMinutes * 60) * 1000;

    while(true) {
        console.log('Generating Search Index...');
        searchIndex.generate('../nginx/webroot');    
        await sleep(waitTimeMs);
    }
}
  
main();