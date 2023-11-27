# Upload your copper backup to Hubspot 

At work! Work nicely for Companies, contacts and their related activities. 

Contributions welcome for a better associations handling as well as deals and projects.

## Preparation 

1. You need a full backup of copper 
2. Get a Hubspot token https://developers.hubspot.com/docs/api/migrate-an-api-key-integration-to-a-private-app
  Check everything relate to CRM and users in Settings as well as "files" in account
3. Set the token as an environement car with `export HUBSPOT_TOKEN="........"`

## Usage

### Fetch all properties on Hubspot

run `node hubspot/getProperties.js`  
All data will be loaded in `../data-hubspot/properties` this is required to check the existing fields on your current setup

### Fetch existing users on Hubspot and map them to copper userIds

run `node hubspot/getOwners.js`  
⚠️ This does not implement paging you might miss some users check in `../data-hubspot/current/owners.json` that you have a full list. 

This will create or update  `../data-hubspot/conf/ownersMap.json` with new entries.

You should MANUALY do the matching by completing `copper` field with copperId.
I had some deleted users on Copper. 


### Fetch existing associations on Hubspot 

run `node hubspot/getAssociations.js`  
The result will be in `../data-hubspot/current/associations.json`. 

/!\ this will try to figure out on its own the "reverse" matching association, it you get any output with messages indicating a problem on the association you must figure out by yourself the underlying problem.....

### Prepare custom fields matching 

run `node hubspot/prepareFieldsMapping.js` to create 
- `../data-hubspot/conf/custom_def.json` you should check and eventually change the matching proposed automatically
- `../data-hubspot/conf/fields_def.json` you should check and eventually change the matching proposed automatically
- `../data-hubspot/conf/custom_connections.json` manually choose the right association by updating `hubspotAssociationKey` to match one of the keys in `../data-hubspot/current/associations.json`. You can also set the value `"auto"` so the scripts will try to create and find the most appropriate matching. Note, that only one of the "direction" of an association should be set, the other should be let to `null`. 

### Create missing properties 

Based on `../data-hubspot/conf/custom_def.json` and `fields_def` the following will create or update properties on hubspot matching copper's data. 

run `node hubspot/createMissingProperties.js`

** This has been implemented to fit my needs and need to be adapated if you want fine-grain matching for your data set **

## Associations

run `node hubspot/createMissingAssociations.js` to checks and create the associations definitions. 

I was limited during this step to be able to create just one labeled association .. it might be usefull in the future. 

### generate Items to be loaded and Perfom checks

Run `node hubspot/generateItems.js` to create items in `data-hubpsot/source/`. These are the items to be uploaded. 

Then run `node hubspot/checks` that will check if all used fields are defined in the properties fiels. The results will warn you if you need to do some adjustments in the conf/* files. 


### upload data 

Run `node hubspot/upload.js` 

You may encounter errors while upload, in my case several invalid emails have been reported. You have then to correct the source data from copper manualy and re run `node hubspot/generateItems.js` to create new data sets. 

Don't worry synchronized items references are kept in `data-hubspot/sync-status` and `node hubspot/upload.js` can be restarted multiple time. 

I got an `Existing item` error after manually terminating the upload in-course. Then you have to find the corresponding item id for copper and hubspot and add it to the related sync file in `data-hubspot/sync-status`. This may also happen when hubspot detect 2 identical entries (email) then just delete the latest entry in copper's source file.

## Generate and upload activities

run `node hubspot/generateActivities.js`
run `node hubspot/uploadActivities.js`