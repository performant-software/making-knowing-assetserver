const fs = require('fs');
const { execSync } = require('child_process');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const googleShareName="BnF Ms Fr 640/Annotations";
const baseDir = 'scripts/content_import/TEMP/annotations';
const targetAnnotationDir = 'nginx/webroot/annotations';
const targetImageDir = 'nginx/webroot/images';
const maxDriveTreeDepth = 20;
const docxMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const jpegMimeType = "image/jpeg";

function downloadAssets() {
    // TODO: Use rclone to create a map of the manuscript folder in google drive
    // rclone lsjson --drive-shared-with-me -R google:"BnF Ms Fr 640/Annotations" > annotation-drive-map.json
    const annotationDriveFile = './scripts/content_import/annotation-drive-map.json';
    const annotationDriveJSON = fs.readFileSync(annotationDriveFile, "utf8");
    const annotationDriveMap = JSON.parse(annotationDriveJSON);
    const driveTreeRoot = createDriveTree(annotationDriveMap);
    const annotationDriveAssets = locateAnnotationAssets( driveTreeRoot );
    const annotationAssets = syncDriveAssets( annotationDriveAssets );
    return annotationAssets;
}

function findLocalAssets() {

    function findDocinDir( dir ) {
        // expect to find a single docx file in this dir
        const dirContents = fs.readdirSync(dir);
        for( let i=0; i < dirContents.length; i++ ) {
            const filename = dirContents[i];
            if( filename.endsWith('.docx') ) return `${dir}/${filename}`;
        }
        return null;
    };

    let annotationAssets = [];
    // go through annotation asset dir and create a source manifest
    const annotationDirs = fs.readdirSync(baseDir);
    annotationDirs.forEach( annotationDir => {
        // ignore hidden directories
        if( annotationDir.startsWith('.') ) return;

        // record text file
        const textFile = findDocinDir(`${baseDir}/${annotationDir}`);
        if( textFile === null ) return;

        // record caption file
        const captionFile = findDocinDir(`${baseDir}/${annotationDir}/captions`)

        // record illustrations
        const illustrationDir = `${baseDir}/${annotationDir}/illustrations`;
        let illustrations = [];
        if( fs.existsSync(illustrationDir) ) {
            const illustrationFiles = fs.readdirSync(illustrationDir);
            illustrationFiles.forEach( illustrationFile => {
                if( illustrationFile.startsWith('.') ) return;                
                const illustrationPath = `${illustrationDir}/${illustrationFile}`;
                illustrations.push(illustrationPath);
            });
        }

        annotationAssets.push({
            id: annotationDir,
            textFile: textFile,
            captionFile: captionFile,
            illustrations: illustrations
        });
    });

    return annotationAssets;
}

function processAnnotations(annotationAssets) {

    let annotationManifest = [];
    annotationAssets.forEach( asset => {
        let annotation = processAnnotation(asset);
        annotationManifest.push(annotation);
    })

    // write out annotation manifest
    const annotationManifestFile = ''; // TODO where does it go?
    fs.writeFileSync(annotationManifestFile, annotationManifest );
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
        const textFileDest = `${annotationDir}/${driveAsset.textFile.name}`;
        syncDriveFile(textFileSrc, annotationDir);

        // create captions dir
        const captionsDir = `${annotationDir}/captions`;
        dirExists(captionsDir);

        // this file is optional
        let captionFileDest = null;
        if( driveAsset.captionFile ) {
            const captionFileSrc = `${googleShareName}${nodeToPath(driveAsset.captionFile)}`;
            captionFileDest = `${captionsDir}/${driveAsset.captionFile.name}`; 
            syncDriveFile(captionFileSrc, captionsDir);
        }

        // make the illustrations dir 
        const illustrationsDir = `${annotationDir}/illustrations`;
        dirExists(illustrationsDir);

        // download all the illustrations
        let illustrations = [];
        driveAsset.illustrations.forEach( illustration => {
            const illustrationSrc = `${googleShareName}${nodeToPath(illustration)}`;
            const illustrationTmp = `${illustrationsDir}/${illustration.name}`;
            const illustrationDest = `${illustrationsDir}/${illustration.id}`;   
            syncDriveFile(illustrationSrc, illustrationsDir);
            fs.renameSync(illustrationTmp,illustrationDest);
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
    // escape all double quotes in source path
    const escSource = source.replace(/"/g, '\\"')
    console.log(`Downloading: ${source}`);
    execSync(`rclone --drive-shared-with-me sync google:"${escSource}" "${dest}"`, (error, stdout, stderr) => {
        console.log(`${stdout}`);
        console.log(`${stderr}`);
        if (error !== null) {
            throw `ERROR: Unable to download file from Google Drive: ${source}`;
        }
    });  
}

function webSafeFilename( unfilteredName ) {
    // TODO what about extensions?
    const filteredName = unfilteredName.replace(/[&?\/"'\s]/g, '_').toLowerCase()
    return filteredName;
}

function processAnnotation( annotationAsset ) {

    function convertToHTML( source, target ) {
        execSync(`pandoc -f docx -t html ${source} > ${target}`, (error, stdout, stderr) => {
            console.log(`${stdout}`);
            console.log(`${stderr}`);
            if (error !== null) {
                throw `ERROR: Unable to process file with pandoc: ${source}`;
            }
        }); 
    }

    dirExists( targetAnnotationDir );
    const annotationID = annotationAsset.id;
    const annotationHTMLFile = `${targetAnnotationDir}/${annotationID}.html`;    

    // Convert docx file to html
    convertToHTML( annotationAsset.textFile, annotationHTMLFile );  
    
    // Make a directory for the illustrations and copy them to there
    const illustrationsDir = `${targetImageDir}/${annotationID}`;
    dirExists( illustrationsDir );
    const illustrations = [];
    annotationAsset.illustrations.forEach( illustration => {
        const urlName = webSafeFilename(illustration);
        const sourceFile = `${baseDir}/${annotationID}/illustrations/${illustration}`
        const targetFile = `${illustrationsDir}/${urlName}`
        fs.copyFileSync( sourceFile, targetFile );
        illustrations.push( urlName );
    })

    // Take the pandoc output and transform it into final annotation html
    processAnnotationHTML(annotationHTMLFile, illustrations);
    
    // TODO Manifest Data Record
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

    const annotation = {
        id: annotationID,
        contentURL: annotationHTMLFile,
        status: "draft"
    };
    
    return annotation;
}

function processAnnotationHTML( annotationHTMLFile ) {

    // load document 
    const html = fs.readFileSync( annotationHTMLFile, "utf8");
    let htmlDOM = new JSDOM(html);
    let doc = htmlDOM.window.document;
  
    // TODO Illustrations
    // Rewrite links to other annotations and to illustrations
    // example of a inline figure:
    // <a href="https://drive.google.com/open?id=1S5NDuD3DLwDeYMrF6NDg2uo_xa-hZVsy"><span class="underline">[FA2017_Elizondo-Garza_29r_1_fig005_ChalkPlParisStucco</span></a>]
    // changes to:
    // <figure>
    //     <img src="/bnf-ms-fr-640/figures/annotations/EG_029r_1_fig1.jpg" alt="Figure 1" />
    //     <figcaption>Figure 1.</figcaption>
    // </figure>

    // TODO Captions 
    // Create an HTML version of captions and parse them into main file

    // TODO Tables
    // - change first row of the table to be a th instead of tr

    // TODO Links
    // - Links to field notes should go to field notes
    // - Links to other annotations should go to those annotations
    // - Mentions of folios should be turned into links to those folios
    // - The annotation should have a link to its folio entry

    // TODO Manifest Data
    // {
    //     "name": "\"Stucco for Molding\", fol. 29r",
    //     "folio": "029r",
    //     "author": "Nina Elizondo-Garza",
    // }

    // write tranformed DOM
    fs.writeFileSync(annotationHTMLFile, htmlDOM.serialize());
}


function main() {

    // TODO control mode with command line args
    const mode = 'process';

    if( mode === 'download' ) {
        downloadAssets();
    }
    if( mode === 'process' ) {
        const annotationAssets = findLocalAssets();
        processAnnotations(annotationAssets);
    }
    if( mode === 'all' ) {
        const annotationAssets = downloadAssets();
        processAnnotations(annotationAssets);
    }
    if( mode === 'help' ) {
        // TODO stdout help
    }

    // TODO index the annotations for search
    // TODO The entry that this annotation is named after should get an outward link to this annotation.
}

///// RUN THE SCRIPT
main();