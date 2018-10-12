const searchIndex = require('../search_index');
const searchEdition = require('../search_edition');
  
function main() {
    const folioPath = 'nginx/webroot/folio';
    const searchIndexPath = 'nginx/webroot/search-idx';
    searchIndex.generate(folioPath, searchIndexPath);
    
    // let halberdTest = searchEdition.search('halberd','tl')
    // let fingerTest = searchEdition.search('finger','tl')
    // let chronicTest = searchEdition.search('chronic','tc')

    // let annoTest = searchEdition.search('Rerum Vulgarium','anno');
}
  
main();