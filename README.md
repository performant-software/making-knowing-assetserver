Making and Knowing Asset Server
================

The server periodically retrieves and updates content in DOCX form from the google drive share, it then converts it to .html and serves it in a known structure as an API for the M+K front end.

To get an individual folio:
```
Format:  
[your domain]/folio/[id]/[tc|tcn|tl]/

Example:  
http://209.97.145.244/folio/p001v/tcn
```

Visit the following to see the status of the import:  
```
[your domain]/import_status.html
```

Setup
-----
1. You will need to set up and configure [rclone](https://rclone.org/) which provides rsync-like functionality. Set up rclone to have a destination called 'google' which is authorized to access the share. On my mac with homebrew and interactive session:  
```
brew install rclone  
rclone config
```

2. Next, install the Javascript dependencies in the scripts/content_import directory:
```
cd scripts/content_import
yarn install
```

3. Install the [pm2](https://pm2.io/) process manager: 

```
cd ../..
yarn global add pm2
```

4. Start the process manager from the base directory of the project:

```
pm2 start
```

Setup Notes
------------

To make the process manager automatically restart on system start:

```
pm2 startup
```

To undo this:

```
pm2 unstartup systemd
```

Asset Server Installation
-------

Please note that the asset server only hosts the data directory, it does not host the making and knowing website. It is only meant to be used during the development of the edition. For production installation, see the making and knowing README.


) install nginx
) install pm2
) clone the making and knowing repo
) clone the m-k-manuscript-data repo
) follow the instructions for installing making and knowing, except make your config file look like:

{
    "editionDataURL": "http://edition-staging.makingandknowing.org/bnf-ms-fr-640",
    "targetDir": "../nginx/webroot/bnf-ms-fr-640",
    "sourceDir": "../m-k-manuscript-data",
    "workingDir": "edition_data/working"
}

) Create the nginx/webroot/bnf-ms-fr-640 directory
) pm2 start to get the thing started



