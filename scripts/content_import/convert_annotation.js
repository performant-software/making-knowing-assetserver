
const fs = require('fs');
var Markdown = require('markdown-it');
   
const inputFile = './TEMP/pan/annotest.md';
const outputFile = './TEMP/pan/annotest.html';

// use pandoc to convert from docx to md:
// pandoc -f docx -t markdown annotest.docx

function main() {
    // read in a markdown file
    let mdAnnotation = fs.readFileSync(inputFile, "utf8");

    // process it to HTML
    let md = new Markdown();
    var result = md.render(mdAnnotation);

    // write it back out
    fs.writeFileSync(outputFile, result );
}

///// RUN THE SCRIPT
main();