const fs = require('fs');
const csv = require('csvtojson');

var generate = async function generate(glossaryCSV, targetGlossaryFile) {  
    const csvData = fs.readFileSync(glossaryCSV).toString()
    let glossaryData = {}
    const tableObj = await csv().fromString(csvData)        
    tableObj.forEach( entry => {
        const headWord = entry['head-word']
        const meaning = {
            partOfSpeech: entry['part-of-speech'],
            meaning: entry['meaning'],
            references: entry['references']
        }
        const existingEntry = glossaryData[headWord]
        if( existingEntry ) {
            // add this meaning to an existing entry
            existingEntry.meanings.push(meaning)
        } else {
            // create a new glossary entry
            const glossaryEntry = {
                headWord,
                alternateSpellings: entry['alternate-spellings'],
                meanings: [ meaning ]
            }
            glossaryData[headWord] = glossaryEntry
        }
    });
    
    // Turn the hash into an alphabetized array

    // write out editorial comments
    fs.writeFile(targetGlossaryFile, JSON.stringify(glossaryData, null, 3), (err) => {
        if (err) {
            console.log(err)
        } 
    });
}
  

// EXPORTS /////////////
module.exports.generate = generate;
