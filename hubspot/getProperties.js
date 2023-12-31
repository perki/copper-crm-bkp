const { hubspotClient } = require('./lib/hubspotClient');
const { fs, path, dataPropertiesPath } = require('./lib/pathsAndFS');

fs.mkdirSync(dataPropertiesPath, { recursive: true });

async function getPropetriesFor(objectType, forceRefresh) {
  const filePath = path.resolve(dataPropertiesPath, objectType + '.json');
  let save = false;
  let definitions = [];
  if (forceRefresh || !fs.existsSync(filePath)) {
    console.log('Fetching properties for: ' + objectType);
    const body = await hubspotClient.crm.properties.coreApi.getAll(objectType, false);
    definitions = body.results;
    save = true;
  } else {
    console.log('Skipped fetching properties for: ' + objectType);
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
  return filtered;
}

module.exports = getPropetriesFor;

if (!global.SKIP_AUTO_GET_PROPERTIES) {
  (async () => {
    for (const objectType of ['companies', 'contacts', 'tasks', 'deals']) {
      await getPropetriesFor(objectType, true)
    };
  })()
}
