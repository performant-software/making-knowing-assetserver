Making and Knowing Asset Server
================

The Making and Knowing Asset Server is used to keep the staging server up to date with the latest folios and commentary from the MK Manuscript Data Repository and the Research Essays from Google Drive. It hosts the data directory for the edition on an nginx server. Please not that the asset server does not host the UI of the edition itself. Please see the Making and Knowing project README for more details. 

Setup
-----

1. Install [nginx](https://nginx.org/) using your favorite package manager.

2. Configure nginx. Your setup may vary depending on OS and other considerations. Here are the steps we used for Ubuntu:

```
cd /etc/nginx/
rm nginx.conf
ln -s /root/making-knowing-assetserver/nginx/nginx.conf nginx.conf
rm sites-enabled 
ln -s /root/making-knowing-assetserver/nginx/sites-enabled/ ./sites-enabled
sudo systemctl reload nginx
cd /
chmod +x root
```

3. Install the [pm2](https://pm2.io/) process manager: 

```
yarn global add pm2
```

4. Clone the [Making and Knowing](https://github.com/cu-mkp/making-knowing-edition) and [MK Manuscript Data](https://github.com/cu-mkp/m-k-manuscript-data) repos into this directory.

```
git clone https://github.com/cu-mkp/making-knowing-edition.git
git clone https://github.com/cu-mkp/m-k-manuscript-data.git
```

5. follow the instructions for installing making and knowing, except make your config file look like:

```
{
    "editionDataURL": "http://edition-staging.makingandknowing.org/bnf-ms-fr-640",
    "targetDir": "../nginx/webroot/bnf-ms-fr-640",
    "sourceDir": "../m-k-manuscript-data",
    "workingDir": "edition_data/working"
}
```

6. Create the necessary directories referenced above.

```
mkdir nginx/webroot/bnf-ms-fr-640
mkdir making-knowing-edition/edition_data/working
```

7. Start the process manager from the base directory of the project:

```
pm2 start
```

Notes
------------

To make the process manager automatically restart on system start:

```
pm2 startup
```

To undo this:

```
pm2 unstartup systemd
```
