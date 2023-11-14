# Copper CRM Backup 

Download most of the data from Copper CRM in JSON format

## Install 

`npm install`

## Usage 

you need a Copper CRM API KEY  / Copper CRM account email pair

`COPPER_APIKEY=xxxxxxx COPPER_EMAIL=you@email.xyz node index.js`

It's possible for multiple reasons (timeouts, over rate limit) that the backup fails or misses items. 
It is safe to re-run it several times, already fetched items will be skipped.
On it's own the script will retry on crashes as long as crashes are occuring less than every 5 seconds;

When everything as been backuped, (do the previous command to check). 
You might want to remove empty files by running `node clean.js`. 
Attention, after this if you restart the backup script all empty entries will be fetched once again.

### File download 

File download is not possible with Copper Developer API !

The trick is to log-in on Copper and copy your company Id and Cookies. 
Company Id can be found in the url `https://app.copper.com/companies/{YOUR COMPANY ID}/app`
To get the cookies, it depends on your Browser, on Chrome:
1. Login Copper 
2. Right click on the page open `inspect` 
3. Go the network tag 
4. Reload Copper page 
5. In the `network` tag click on `check` on the left pane
6. Go to the `Headers` tab in `Request Headers` section and copy the `Cookie` contents. 

It is a quite long string that looks like 
`_fbp=....; logged_in_copper_user=active; pnctest=1; ajs_anonymous_id=...; ajs_user_id=...; ajs_group_id=...; intercom-device-id-t10sa4e7=...; ...`

Set the company code as environement variable `COPPER_COMPANY` and the cookies string as `COPPER_COOKIES` 

run `node files.js`

### extras

`node clean/cleanFiles.js` will remove all data files containing an empty array

`node clean/removeEmptyfields.js` will remove empty and unsued fields from the backup .. MAKE A BACKUP OF `./data` before running!

## Notes 

This backup is not incremental it first fetches list of the different items then retrieve them one by one. 
Data is saved in "data/" folder in `json` format.

An attempt of parallelization has been made with rate-limiting as Copper's API is limiting to 180 calls / minutes.
The current logic is pretty weak and could be rewritten using a pool of calls and a fixed number of parrallel call to do.

Files that are `links` to external ressources such as Google Drive are saved with as `data/files/{id}.json` items; 

### Missing 
- It seems nothing 😅
