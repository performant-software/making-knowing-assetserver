// Includes
const xml2js = require('xml2js');
const argv = require('yargs').argv;
const fs = require('fs');
const util = require('util');
const path = require('path');
const renameKeys = require('rename-keys');
const he = require('he');

// Params provided?
if ((typeof argv.src == "undefined")) {
	console.log("Usage: convert --src /path/to/xml");
	process.exit();
}

// Strip newlines, tabs
var parser = new xml2js.Parser();
var builder = new xml2js.Builder();
var fileContents = fs.readFileSync(argv.src, "utf8");
fileContents = fileContents.replace(/(\r\n|\n|\r|\t)/gm, "");

// Wrap the entire thing in a parent tag (necessary for parser)
// add header material (just for our process)
var xml;
xml  = 	'<html>';
xml += 		'<head>';
xml += 			'<meta charset="utf-8"/>';
xml += 			'<title>'+path.basename(argv.src).split(".")[0]+'</title>';
xml += 		'</head>';
xml += 		'<body>';
xml +=				fileContents;
xml += 		'</body>';
xml +=		'</html>';


// Encode everything inside <ab> tags for now
// some stuff <ab> more stuff </ab> maybe some stuff <ab>the</ab> end
var splitString = xml.split("<ab>");
var xml_without_ab=splitString[0];
var ab_contents_array=[];
if(splitString.length > 0){
	xml_without_ab+="<ab></ab>";
	for(var idx=1;idx<splitString.length;idx++){
		var thisChunk = splitString[idx];
		var subString = thisChunk.split("</ab>");
		if(subString.length > 0){
			ab_contents_array.push(subString[0]);
			for(var idx2=1;idx2<subString.length;idx2++){
				xml_without_ab += subString[idx2];
			}
		}else{
			xml_without_ab += thisChunk;
		}
		if(idx !== (splitString.length-1)){
			xml_without_ab+="<ab></ab>";
		}
	}
}else{
	console.log("Warning: No <ab> tags found");
}
debugger

// Parser options
// this includes an array of functions that handle various things
var parserOptions = {
	"tagNameProcessors": [convertTags],
	"attrNameProcessors": [],
	"valueProcessors": [],
	"attrValueProcessors": [],

	"preserveChildrenOrder": true
};

// Run the parser
var jsonRepresentation;
xml2js.parseString(
	xml,
	parserOptions,
	function(err, result) {
		jsonRepresentation = result;
	}
);
console.log(JSON.stringify(jsonRepresentation));

// Tag/attribute processors
function convertTags(name) {
	switch (name) {

		// lb (linebreak) becomes br
		case 'lb':
			return 'br';
			break;

		// head -> h4
		case 'head':
			return 'h4';
			break;

		// del (delete) becomes strikethrough
		case 'del':
			return 's';
			break;

		default:
			return name;
	}
}


// Rebuild into XML
//console.log(JSON.stringify(jsonRepresentation));
var xml = builder.buildObject(jsonRepresentation);
console.log(xml);
