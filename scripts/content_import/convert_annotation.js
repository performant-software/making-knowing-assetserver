const fs = require('fs');
const inputFile = './scripts/content_import/TEMP/annotations/EG_029r_1.md';
const outputFile = '../making-knowing/public/bnf-ms-fr-640/annotations/anno1.html'

// use pandoc to convert from docx to html:
// pandoc -f docx -t html EG_029r_1.docx > ../../../../../making-knowing/public/bnf-ms-fr-640/annotations/EG_029r_1.html

function main() {
    // read in HTML file
    let annotationHTML = fs.readFileSync(inputFile, "utf8");

    // load it into JSDOM and make the following changes:

    // rewrite the image URLs
    // download images?

    // write it back out
    fs.writeFileSync(outputFile, result );
}

///// RUN THE SCRIPT
main();