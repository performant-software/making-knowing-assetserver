const fs = require('fs');

function processAnnotations() {
    const annotationDriveFile = './scripts/content_import/annotation-drive-map.json';
    const annotationDriveJSON = fs.readFileSync(annotationDriveFile, "utf8");
    const annotationDriveMap = JSON.parse(annotationDriveJSON);
    const annotationDriveTree = createDriveTree(annotationDriveMap)

    // locate all the annotations that can be processed
    // - inside semester folders
    // - folders for each annotation
    // - there must be a txt folder
    // - there must be one file in txt that is docx
    // - optionally an images folder and a captions folder
    // const annotations = locateAnnotations(annotationDriveTree);
    // annotations retain the googleDrive ID for crosswalking
    // report out the annotation folders that didn't validate

    // process the annotation sources into annotations
    // - grab the files using rclone and rename
    // use pandoc to convert from docx to html:
    // pandoc -f docx -t html EG_029r_1.docx > ../../../../../making-knowing/public/bnf-ms-fr-640/annotations/EG_029r_1.html
    //   - where does file go in the tree?
    //   - map between google drive ID and web resource location
    //   - pandoc docx -> html
    //   - rewrite links to other annotations and to illustrations?
    //   - how to pull in illustrations and captions
    // - add annotation to json directory
    //   - set status as draft
    //   - determine title
    //   - determine author
    //   - extract abstract
    //   - determine folio
    //   - thumbnail?
    // for each -- processAnnotation()

    // write out annotation manifest
    // fs.writeFileSync(annotationManifest, result );

    // TODO index the annotations for search

    console.log('annotation processing complete.')
}

function createDriveTree(driveMap) {
    let driveTree = [];

    // drive map entry from rclone lsjson:
    // {
    //     "Path":"(1) 2014 Fall Annotations - Metalworking \u0026 Moldmaking ",
    //     "Name":"(1) 2014 Fall Annotations - Metalworking \u0026 Moldmaking ",
    //     "Size":-1,
    //     "MimeType":"inode/directory",
    //     "ModTime":"2018-01-08T16:45:48.659Z",
    //     "IsDir":true,
    //     "ID":"0BwJi-u8sfkVDfjlwTEhJVkxJNlFLcS1temhqeWU1VmhJbDdjMHNRYjR1WkQ0WmVoNGc5U1k"
    // }

    // drive tree node
    // {
    //     id: id,
    //     name: name,
    //     mimeType: mimeType,
    //     children: []
    //  }

    // annotation list
    // [
    //     {
    //         id
    //         textFile
    //         citations
    //         illustrations
    //     }
    // ]

    // { googleDriveID: annotation }

    driveMap.forEach( entry => {
        // parse out the ancestors and return them as an array
        const path = entry["Path"].split('/');
        const pathNode = addPathToTree( path, driveTree );

        // start from the top of the tree and walk down
        // creating nodes where entries don't yet exist
        // add the entry itself at the leaf 
        // if is dir is true, just add a node
    });

    return driveTree;
}

function addPathToTree( path, driveTree ) {
    driveTree.forEach( entry => {
        entry["IsDir"]
        

    })

}


function main() {
    // Use rclone to create a map of the manuscript folder in google drive
    // rclone lsjson --drive-shared-with-me -R google:"BnF Ms Fr 640/__Manuscript Pages" > google-drive-map.json

    processAnnotations();
}

///// RUN THE SCRIPT
main();