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

An attempt of parallelization has been made with rate-limiting as Copper's API is limiting to 180 calls / minutes.
The current logic is pretty weak and could be rewritten using a pool of calls and a fixed number of parrallel call to do.

### Missing 
- Files
