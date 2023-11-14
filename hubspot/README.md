# Upload your copper backup to Hubspot 

## Usage

### Fetch all properties on Hubspot

run `node hubspot/getProperties.js`  
All data will be loaded in `../data-hubspot/properties` this is required to check the existing fields on your current setup

### Fetch existing users on Hubspot and map them to userIds

run `node hubspot/getUsers.js`  
⚠️ This does not implement paging you might miss some users check in `../data-hubspot/current/owners.json` that you have a full list. 

This will create or update  `../data-hubspot/conf/ownersMap.json` with new entries.

You should MANUALY do the matching by completing `copper` field with copperId.

### Prepare custom fields matching 

run `node hubspot/prepareFieldsMapping.js` to create 
- `../data-hubspot/conf/custom_def.json` you should check and eventually change the matching proposed automatically


