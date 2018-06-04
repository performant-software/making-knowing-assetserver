// Includes
const argv = require('yargs').argv;
const fs = require('fs');
const util = require('util');
const path = require('path');
const he = require('he');
const minify = require('html-minifier').minify;
const beautify = require('html-beautify');

// Params provided?
if ((typeof argv.src == "undefined")) {
	console.log("Usage: convert --src /path/to/xml");
	process.exit();
}

var f_beautify = (typeof argv.beautify !== "undefined");

// Strip newlines, tabs
var xml = fs.readFileSync(argv.src, "utf8");
xml = xml.replace(/(\r\n|\n|\r|\t)/gm, "");

// Run through a minifier, mostly to remove any gaps between tags, but also generally cleans things
var xml = minify(xml, {
  removeAttributeQuotes: true
});

// Set aside contents of <ab> tags for now
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

// Strip anything extraneous before the first div
var splitString = xml_without_ab.split("<div>");
xml_without_ab="";
for(var idx=0;idx<splitString.length;idx++){
	var thisSegment=splitString[idx];
	if(thisSegment.includes("</div>")){
		xml_without_ab += '<div>'+thisSegment;
	}
}

// Convert <div><id>blah</id> into <div id="blah">
xml_without_ab = xml_without_ab.replace(/<div><id>([^<]+)/g, '<div id=\"$1\">');
xml_without_ab = xml_without_ab.replace(/<\/id>/g, '');

// Convert <head> to <h2>
xml_without_ab = xml_without_ab.replace(/head>/g, 'h2>');


// Add header material and folio wrapper, parsing filename for title
var header= '<!DOCTYPE html>';
header +=	'<html>';
header += 		'<head>';
header += 			'<meta charset="utf-8"/>';
header += 			'<title>'+path.basename(argv.src).split(".")[0]+'</title>';
header += 		'</head>';
header += 		'<body>';
header +=			'<folio layout=\"margin\">';
header +=				xml_without_ab;
header +=			'</folio>';
header += 		'</body>';
header +=	'</html>';
xml_without_ab = header;


// Parse layout (margin tag in AB blocks)
for(var idx=0;idx<ab_contents_array.length;idx++){
	var thisBlock = ab_contents_array[idx];

	// If the margin is missing, assume <margin>center</margin>
	if (thisBlock.substring(0, 8) !== '<margin>'){
		thisBlock = '<margin>center</margin>'+thisBlock;
	}
	// For each AB block, they begin with a <margin> that should be converted to
	// <div data-layout="*CONTENTS OF MARGIN*" data-layout-hint="tall" class="small-font">
	// FIXME: Need to figure out where these attribs come from: data-layout-hint=\"tall\" class=\"small-font\"
	thisBlock = thisBlock.replace(/<margin>([^<]+)<\/margin>/g, '<div data-layout=\"$1\">');

	// Replace LB with BR
	thisBlock = thisBlock.replace(/<lb>/g, '<br/>');

	ab_contents_array[idx] = thisBlock + '</div>';
}

// Reassemble
var docparts = xml_without_ab.split("<ab></ab>");
xml = "";
for(var idx=0;idx<docparts.length;idx++){

	// Move anything outside the div we're building into the first replacement block
	var regExp = /<div id=\".*\">(.*)/g;
	var match = regExp.exec(docparts[idx]);
	var headerContent='';
	if(	typeof match !== 'undefined' &&
		match != null &&
		typeof match[1] !== 'undefined'){
			headerContent = match[1];
			docparts[idx] = docparts[idx].replace(headerContent,'');
	}

	xml += docparts[idx];
	if(typeof ab_contents_array[idx] !== 'undefined'){
		var abBlock = ab_contents_array[idx];
		if (headerContent.length > 0){
			var regExp = /(<div .+?(?=>)>)(.*)/g;
			var match = regExp.exec(abBlock);
			if( typeof match !== 'undefined' &&
				match != null &&
				typeof match[1] !== 'undefined'){
					abBlock=match[1]+headerContent+"\n"+match[2];
			}
		}
		xml += abBlock;
	}
}

// // Strip all <figure> tags
// // Per https://github.com/cu-mkp/making-knowing-edition/issues/22, replace them with div
// xml = xml.replace(/<figure><id>([^<]+)/g, '<div class="figure" id=\"$1\"></div><figure><id>');
// xml = xml.replace(/<figure>.*<\/figure>/g, '');

// Beautify HTML
if(f_beautify){
	xml = beautify(xml);
}

console.log(xml);
