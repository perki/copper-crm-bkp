const fs = require('fs');
const path = require('path');
const hubspot = require('@hubspot/api-client');

const basePath = path.resolve(__dirname, '../data-hubspot', 'properties');
fs.mkdirSync(basePath, {recursive: true});

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
if (! HUBSPOT_TOKEN) throw new Error('HUBSPOT_TOKEN environement variable missing');


const hubspotClient = new hubspot.Client({ accessToken: HUBSPOT_TOKEN });

async function go() {
  for (const objectType of ['companies', 'contacts', 'tasks', 'deals']) {
    const filePath = path.resolve(basePath, objectType + '.json');
    let save = false;
    let definitions = [];
    if (! fs.existsSync(filePath)) {
      console.log('Fetching properties for: ' + objectType);
      const body = await hubspotClient.crm.properties.coreApi.getAll(objectType, false);
      definitions = body.results;
      save = true;
    } else {
      definitions = require(filePath);
    }
    // remove readOnly fields 
    const filtered = definitions.filter((prop) => {
      if (prop.modificationMetadata.readOnlyValue) return false;
      return true;
    });
    if (Object.keys(filtered).length !== Object.keys(definitions).length) save = true;

    if (save) { 
      fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2));
      console.log('Updated: ' + objectType);
    }
  }
}


(async () => {
  await go()
})()