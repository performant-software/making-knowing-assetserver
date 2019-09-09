Making and Knowing Asset Server
================

The Making and Knowing Asset Server is used to keep the staging server up to date with the latest folios and commentary from the MK Manuscript Data Repository and the Research Essays from Google Drive. It hosts the data directory for the edition on an nginx server. Please not that the asset server does not host the UI of the edition itself. Please see the Making and Knowing project README for more details. 

Setup
-----

1. You will need to set up and configure [rclone](https://rclone.org/) which provides rsync-like functionality. Set up rclone to have a destination called 'google' which is authorized to access the share. On my mac with homebrew and interactive session:  

```
brew install rclone  
rclone config
```

2. Install the [pm2](https://pm2.io/) process manager: 

```
cd ../..
yarn global add pm2
```

3. Clone the [Making and Knowing](https://github.com/cu-mkp/making-knowing-edition) and [MK Manuscript Data](https://github.com/cu-mkp/m-k-manuscript-data) repos into this directory.

```
git clone https://github.com/cu-mkp/making-knowing-edition.git
git clone https://github.com/cu-mkp/m-k-manuscript-data.git
```

4. follow the instructions for installing making and knowing, except make your config file look like:

```
{
    "editionDataURL": "http://edition-staging.makingandknowing.org/bnf-ms-fr-640",
    "targetDir": "../nginx/webroot/bnf-ms-fr-640",
    "sourceDir": "../m-k-manuscript-data",
    "workingDir": "edition_data/working"
}
```

5. Create the `nginx/webroot/bnf-ms-fr-640` directory reference above.

```
mkdir nginx/webroot/bnf-ms-fr-640
```

6. Start the process manager from the base directory of the project:

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
