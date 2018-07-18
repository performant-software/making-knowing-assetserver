const searchIndex = require('../search_index');
  
function main() {
    searchIndex.generate('./nginx/webroot');    
}
  
main();