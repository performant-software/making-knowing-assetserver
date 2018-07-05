
const fs = require('fs');
var Markdown = require('markdown-it')()
// var { markdownItTable } = require('markdown-it-table');
const inputFile = './TEMP/pan/annotest.md';
const outputFile = './TEMP/pan/annotest.html';

// use pandoc to convert from docx to md:
// pandoc -f docx -t markdown annotest2.docx > annotest.md

function main() {

    Markdown.use(require('markdown-it-footnote'));
    Markdown.use(require('markdown-it-multimd-table'));

    // read in a markdown file
    let mdAnnotation = fs.readFileSync(inputFile, "utf8");

    // process it to HTML
    var result = Markdown.render(mdAnnotation);

    // write it back out
    fs.writeFileSync(outputFile, result );
}

///// RUN THE SCRIPT
main();