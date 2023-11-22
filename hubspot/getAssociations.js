const { hubspotClient, hubspotApi } = require('./lib/hubspotClient');
const { fs, path, dataCurrentPath } = require('./lib/pathsAndFS');
const { pluralMap } = require('./lib/typeMaps');
const getHubspotAssociationKey = require('./lib/getHubspotAssociationKey');

async function getAssociations(forceFecth) {
  const filePath = path.resolve(dataCurrentPath, 'associations.json');
  if (fs.existsSync(filePath) && ! forceFecth) {
    return require(filePath);
  }
  
  const associations = {};
  for (const fromType of Object.keys(pluralMap)) {
    associations[fromType] = {};
    for (const toType of Object.keys(pluralMap)) {
      const body = await hubspotApi.get('v4/associations/' + fromType + '/' + toType + '/labels');
      await new Promise((r) => { setTimeout(r, 200) });
      for (const item of body.results) {
        const entry = {
          toType,
          label: item.label,
          category: item.category,
          typeId: item.typeId
        }
        const hubspotAssociationKey = getHubspotAssociationKey(fromType, toType, item.label);
        associations[fromType][hubspotAssociationKey] = entry;
      }
    }
  };
    
  fs.writeFileSync(filePath, JSON.stringify(associations, null, 2));
  return associations;
}

module.exports = getAssociations;

if (!global.SKIP_AUTO_GET_ASSOCIATIONS) {
  (async () => {
    await getAssociations(true);
  })();
}
