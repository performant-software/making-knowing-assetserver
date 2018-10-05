const searchIndex = require('../search_index');
const searchEdition = require('../search_edition');
  
function main() {
    // searchIndex.generate('./nginx/webroot');   
    
    // let halberdTest = searchEdition.search('halberd','tl')
    // let fingerTest = searchEdition.search('finger','tl')
    // let chronicTest = searchEdition.search('chronic','tc')

    let annoTest = searchEdition.search('Rerum Vulgarium','anno');

    console.log('done');
}
  
main();