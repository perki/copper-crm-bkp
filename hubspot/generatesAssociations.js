const { fs , path, dataPath, dataSourcePath } = require('./lib/pathsAndFS');
const { mapType, pluralMap } = require('./lib/typeMaps');
const { getHubspotAssociationKey } = require('./lib/getHubspotAssociationKey');
const { SyncStatus } = require('./lib/pathsAndFS')
const { getAssociations } = require('./getAssociations');

let associationsDefs = null;

const associationsFilePath = path.resolve(dataSourcePath, 'associations.json')
const associations = fs.existsSync() ? require(associationsFilePath) : {};



const syncMaps = {
  company : new SyncStatus('companies'),
  contact : new SyncStatus('contacts')
}

function generateAssociation (copperType, fromHsType, item) {
  const items = require('../data/' + copperType + 'List.json');
  for (const item of items) {
    const fromHsId = syncMaps[fromHsType].get(item.id);
    if (fromHsId == null) throw new Error('Cannot find hubspotId for ' + item.id + '  ' + JSON.stringify(item));
    const relatedPath = path.resolve(__dirname,'../data/', copperType + '-related', item.id + '.json');
    if (! fs.existsSync(relatedPath)) continue;
    const relatedItems = JSON.parse(fs.readFileSync(relatedPath));
    for (const relatedItem of relatedItems) {
      const toHsType = mapType[relatedItem.type];
      
      if (! ['company', 'contact'].includes(toHsType)) continue;
      
      const toHsId = syncMaps[toHsType].get(relatedItem.id);
      if (toHsId == null) throw new Error('Cannot find hubspotId for ' + relatedItem.id + '  ' + relatedItem.type);

      const associationKey = getHubspotAssociationKey(fromHsType, toHsType, null);
      const associationDef = associationsDefs[associationKey];
      if (associationDef == null) throw new Error('Cannot find association key ' + associationKey);
      console.log(associationDef);
    

      const associationMark = associationKey + ':' + fromHsId + ':' + toHsId;
      const associationMarkRev = associationDef.reverse + ':' + fromHsId + ':' + toHsId;
      if (associations[associationMark] != null) {
        if (associations[associationMarkRev] == associationMark) continue;
        throw new Error('Wrong association mark '+ associationMark + ' points to ' + associationMarkRev + ' which points to ' + associations[associationMarkRev]);
      }
      if (associations[associationMarkRev] != null) throw new Error('A rev mark exist '+ associationMarkRev+ ' but not the origin:' + associationMark);
      associations[associationMark] = associationMarkRev;
      associations[associationMarkRev] = associationMark;
    }
  }
}

if (true) {
  (async () => {
    associationsDefs = await getAssociations();
    generateAssociation('people', 'contact');
    generateAssociation('leads', 'contact');
    generateAssociation('companies', 'company');
    console.log(associations);
    fs.writeFileSync(associationsFilePath, JSON.stringify(associations, null, 2));
  })();
}

