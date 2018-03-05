Making and Knowing Asset Server
================

The server periodically retrieves and updates content in DOCX form from the google drive share, it then converts it to .html and serves it in a known structure as an API for the M+K front end.

To get an individual folio:
```
Format:  
http://159.65.186.2/folio/[id]/[tc|tcn|tl]/

Example:  
http://159.65.186.2/folio/p001v/tcn
```

Manifest of all folios:
```
http://159.65.186.2/folio/manifest.json
```

To see the status of the import:  
```
http://159.65.186.2/import_status.json (JSON)

http://159.65.186.2/import_status.html (Human)
```
---

Setup
-----
1. You will need to set up and configure [rclone](https://rclone.org/) which provides rsync-like functionality. Set up rclone to have a destination called 'google' which is authorized to access the share. On my mac with homebrew and intereactive session:  
```
brew install rclone  
rclone config
```

2. The rest of this is a series of bash scripts that use built-in functionality and node for the actual document conversion. To make sure node is set up properly:
```
cd scripts/content_import
npm install
```
If node, npm and packages are installed then you should see the following when you invoke *node _convert.js*. If you see any errors, double check the dependencies are installed.
```
user@makingandknowing:~/#> node _convert.js
Usage: convert --src /path/to/xml
user@makingandknowing:~/#>
```

3. Do this from the script directory:
```
user@makingandknowing:~/#> ./import
user@makingandknowing:~/#> ./init
user@makingandknowing:~/#> ./import
```
__Why Init?:__  
Each full import takes about 10 minutes depending on local weather conditions. Because of this, I have added the ability for the script to only process new files, this is the default. THE VERY FIRST TIME THAT YOU USE THIS TOOL FOR A BATCH RUN you should also run ```./import``` which will download the files from google, it will then attempt to convert the files but they will likely appear older and nothing will happen. Now run ```./init``` which will set up the file dates properly. After this you will never need to run init again, as the script will only import newer files.  

 - If you subsequently want to force re-import of all files, you may run ```./init``` again.

 - If you want to disable this behavior entirely, comment out the if statements that look like this: ```if [ "$INFILE" -nt "$SELF" ]``` (there are two, one in _convert.sh and one in _extract.sh).


Invoking Manually
-----------------
- The server is configured to invoke the batch conversion *./import_cron* periodically via cron.  
```*/20 * * * * . $HOME/.profile;/root/makingAndKnowing/scripts/import_cron```

If you want to invoke it manually:

- Do everything, includes sync from Google:  
```./import ```

- Log to a file instead of console:  
```./import >logfile.txt 2>&1```


- Single file (file should be local first):  
```./import /path/to/file.docx ```

- Log to a file instead of console:  
```./import /path/to/file.docx  >logfile.txt 2>&1```
