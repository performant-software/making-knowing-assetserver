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


Invoking Manually
-----------------
- The server is configured to invoke the batch conversion *./import_cron* periodically via cron.  
```*/20 * * * * .../import_cron```

If you want to invoke it manually:

- Do everything, includes sync from Google:  
```./import ```

- Log to a file instead of console:  
```./import >logfile.txt 2>&1```


- Single file (file should be local first):  
```./import /path/to/file.docx ```

- Log to a file instead of console:  
```./import /path/to/file.docx  >logfile.txt 2>&1```
