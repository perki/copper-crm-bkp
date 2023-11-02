# Copper CRM Backup 

Download most of the data from Copper CRM in JSON format

## Install 

`npm install`

## Usage 

you need a Copper CRM API KEY  / Copper CRM account email pair

`COPPER_APIKEY=xxxxxxx COPPER_EMAIL=you@email.xyz node index.js`

It's possible for multiple reasons (timeouts, over rate limit) that the backup fails or misses items. 
It is safe to re-run it several times, already fetched items will be skipped.

## Notes 

This backup is not incremental it first fetches list of the different items then retrieve them one by one. 
Data is saved in "data/" folder in `json` format.

Some attempts of parallelization have been made, but they ended up in rate-limiting Errors from Copper's API which is limiting to 180 calls / minutes.
This is why this code is not optimitzed and uses intensively fs.Sync methods and executing calls in series.

### Missing 
- Files
