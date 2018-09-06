const fs = require('fs');
const { execSync } = require('child_process');

const googleShareName="\"BnF\ Ms\ Fr\ 640/__Manuscript\ Pages\"";
const baseDir = 'scripts/content_import/TEMP/annotations';
const maxDriveTreeDepth = 20;
const docxMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const jpegMimeType = "image/jpeg";

function processAnnotations() {
    const annotationDriveFile = './scripts/content_import/annotation-drive-map.json';
    const annotationDriveJSON = fs.readFileSync(annotationDriveFile, "utf8");
    const annotationDriveMap = JSON.parse(annotationDriveJSON);
    const driveTreeRoot = createDriveTree(annotationDriveMap);
    const annotationDriveAssets = locateAnnotationAssets( driveTreeRoot );
    const annotationAssets = syncDriveAssets( annotationDriveAssets );

    return;
    //////////

    let annotationManifest = [];
    annotationAssets.forEach( asset => {
        let annotation = processAnnotation(asset);
        annotationManifest.push(annotation);
    })

    // write out annotation manifest
    const annotationManifestFile = ''; // TODO where does it go?
    fs.writeFileSync(annotationManifestFile, annotationManifest );

    // TODO index the annotations for search

    console.log('annotation processing complete.')
}

function createDriveTree(driveMap) {

    // recursively explore the tree looking for parent that matches path
    function findParent( entry, ancestor, path ) {
        if( path.length === 1 ) {
            return ancestor;
        } else {
            let nextAncestor = path[0]
            for( let i=0; i < ancestor.children.length; i++ ) {
                let child = ancestor.children[i];
                if( child.name === nextAncestor ) {
                    path.shift();
                    return findParent( entry, child, path );
                }
            }
            return null;
        }
    };

    const rootNode = {
        id: '0',
        name: "",
        mimeType: "inode/directory",
        parent: null,
        children: []
    };

    // scan the drive map until all the entries have been added to the tree. 
    // give up after maxDriveTreeDepth iterations 
    let stillLooking = true;
    let attempts = 0;
    while( stillLooking && attempts < maxDriveTreeDepth ) {
        attempts = attempts + 1;
        stillLooking = false;
        driveMap.forEach( entry => {
            if( !entry.added ) {
                const path = entry["Path"].split('/');
                let parent = findParent( entry, rootNode, path );        
                if( parent ) {
                    let node = {
                        id: entry["ID"],
                        name: entry["Name"],
                        mimeType: entry["MimeType"],
                        parent: parent
                    }
                    node.children = entry["IsDir"] ? [] : null; 
                    parent.children.push( node );
                    entry.added = true;
                } else {
                    // parent isn't in the tree yet, keep looking!
                    stillLooking = true;
                }                    
            }    
        });    
    }

    if( stillLooking ) {
        throw `ERROR: Google Drive tree exceeds max depth of ${maxDriveTreeDepth}!`;         
    }

    return rootNode;
}

function locateAnnotationAssets( driveTreeRoot ) {

    let annotationAssets = [];
    let errors = [];

    driveTreeRoot.children.forEach( semester => {
        semester.children.forEach( annotationRoot => {
            let textFileNode = null;
            let captionFile = null;
            let illustrations = [];
            if( annotationRoot.children ) {
                annotationRoot.children.forEach( assetFolder => {
                    if( assetFolder.children ) {
                        // locate the text file and captions file in docx format, there should be exactly one in folder
                        if( assetFolder.children.length === 1 ) {
                            let fileNode = assetFolder.children[0];
                            if( fileNode.mimeType === docxMimeType ) {
                                if( assetFolder.name.includes('Text_') ) {
                                    textFileNode = fileNode;
                                } else if( assetFolder.name.includes('Captions_') ) {
                                    captionFile = fileNode;
                                }        
                            }
                        }

                        // locate the illustrations, if any
                        if( assetFolder.name.includes('Illustrations_') ) {
                            assetFolder.children.forEach( illustrationFile => {
                                if( illustrationFile.mimeType === jpegMimeType ) {
                                    illustrations.push( illustrationFile );
                                }
                            });
                        }
                    } else {
                        // TODO log that this asset folder has no sub folders
                        
                    }
                });    
            } else {
                // TODO log that this annotation folder has no sub folders
            }

            if( textFileNode ) {
                annotationAssets.push({
                    id: textFileNode.id,
                    textFile: textFileNode,
                    captionFile: captionFile,
                    illustrations: illustrations
                });
            } else {
                // TODO log that this annotation folder didn't have a valid text file
            }
        });
    });

    if( errors.length > 0 ) {
        // TODO create an error report
    }

    return annotationAssets;
}

function syncDriveAssets( driveAssets ) {

    function nodeToPath( fileNode, path=[] ) {
        path.push(fileNode.name);
        if( fileNode.parent !== null ) {
            return nodeToPath( fileNode.parent, path );
        }
        return path.reverse().join('/');
    }    
    
    // create local directory to store assets
    dirExists(baseDir);

    // iterate through drive assets, downloading each one and placing them in correct spot in baseDir
    localAssets = [];
    driveAssets.forEach( driveAsset => {

        // make the annotation dir 
        const annotationDir = `${baseDir}/${driveAsset.id}`;
        dirExists(annotationDir);

        const textFileSrc = `${googleShareName}${nodeToPath(driveAsset.textFile)}`;
        const textFileDest = `${annotationDir}/${driveAsset.textFile.name}`
        syncDriveFile(textFileSrc, textFileDest);

        // this file is optional
        if( driveAsset.captionFile ) {
            const captionFileSrc = `${googleShareName}${nodeToPath(driveAsset.captionFile)}`;
            const captionFileDest = `${annotationDir}/${driveAsset.captionFile.name}`    
            syncDriveFile(captionFileSrc, captionFileDest);
        }

        // make the illustrations dir 
        const illustrationsDir = `${annotationDir}/illustrations`;
        dirExists(illustrationsDir);

        // download all the illustrations
        let illustrations = [];
        driveAsset.illustrations.forEach( illustration => {
            const illustrationSrc = `${googleShareName}${nodeToPath(illustration)}`;
            const illustrationDest = `${illustrationsDir}/${illustration.name}`    
            syncDriveFile(illustrationSrc, illustrationDest);
            illustrations.push(illustrationDest);
        });

        localAssets.push({
            id: driveAsset.id,
            textFile: textFileDest,
            captionFile: captionFileDest,
            illustrations: illustrations
        })
    });

    return localAssets;
}

function dirExists( dir ) {
    if( !fs.existsSync(dir) ) {
      fs.mkdirSync(dir);
      if( !fs.existsSync(dir) ) {
        throw `ERROR: ${dir} not found and unable to create it.`;
      }
    }  
}

function syncDriveFile( source, dest ) {
    execSync(`rclone --drive-shared-with-me sync google:${source} ${dest}`, (error, stdout, stderr) => {
        console.log(`${stdout}`);
        console.log(`${stderr}`);
        if (error !== null) {
            throw `ERROR: Unable to download file from Google Drive: ${source}`;
        }
    });  
}

function processAnnotation( annotationAsset ) {

    // webroot/documents dir
    //     <annotation|fieldnote id>.html
    // webroot/images/<annotation|fieldnote id>
    //     filenames

    // annotation
        // {
        //     "id": "0BwJi-u8sfkVDfjlwTEhJVkxJNlFLcS1temhqeWU1VmhJbDdjMHNRYjR1WkQ0WmVoNGc5U1k",
        //     "name": "\"Stucco for Molding\", fol. 29r",
        //     "contentURL": "http://edition-staging.makingandknowing.org/bnf-ms-fr-640/annotations/0BwJi-u8sfkVDfjlwTEhJVkxJNlFLcS1temhqeWU1VmhJbDdjMHNRYjR1WkQ0WmVoNGc5U1k.html",
        //     "folio": "029r",
        //     "author": "Nina Elizondo-Garza",
        //     "abstract": "Abstract: Fol. 29r_1 describes a method for creating stucco which the author-practitioner claims is versatile and inexpensive. This annotation conducts a material-based analysis of the entry, including a reconstruction following the instructions in this entry and a historical investigation of ancient and early modern stucco recipes and stucco use, to better situate the author-practitioner within his context. These comparisons reveal that the author-practitioner's recipe is apparently unusual. Moreover, investigating stucco highlights the author-practitioner's interest in ornamentation, his focus on using pre-existing patterns rather than creating new ones, and his possible first-hand experiences of making domestic and ephemeral decorative art.",
        //     "thumbnail": "http://edition-staging.makingandknowing.org/bnf-ms-fr-640/figures/annotations/0BwJi-u8sfkVDfjlwTEhJVkxJNlFLcS1temhqeWU1VmhJbDdjMHNRYjR1WkQ0WmVoNGc5U1k.jpg",
        //     "status": "draft"
        // }

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

}


function main() {
    // Use rclone to create a map of the manuscript folder in google drive
    // rclone lsjson --drive-shared-with-me -R google:"BnF Ms Fr 640/__Manuscript Pages" > google-drive-map.json

    processAnnotations();
}

///// RUN THE SCRIPT
main();