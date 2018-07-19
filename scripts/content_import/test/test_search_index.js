const searchIndex = require('../search_index');
const searchEdition = require('../search_edition');
  
function main() {
    searchIndex.generate('./nginx/webroot');   
    
    let halberdTest = searchEdition.search('halberd','tl')
    let fingerTest = searchEdition.search('finger','tl')
    console.log('done');
}
  
main();