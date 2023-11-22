global.SKIP_AUTO_GET_ASSOCIATIONS = true; // prevent getAssociations to run automatically
const { hubspotApi } = require('./lib/hubspotClient');
const getAssociations = require('./getAssociations');
const { SyncStatus } = require('./lib/pathsAndFS');

const { pluralMap } = require('./lib/typeMaps');

const customAssociations = require('../data-hubspot/conf/custom_connections.json');

let currentAssociations = null;
const currentAssociationsMap = {};
const customMap = {};
const syncStatus = new SyncStatus('associationDefinitions');

(async () => { 
  await initHubspot();
  initCopperCustoms();
  const autos = checkCustomsAndGetAuto();
  if (await createMissingAssociations(autos) > 0) {
    await getAssociations(true); // refresh associations
  }
})();

async function createMissingAssociations(autos) {
  let created = 0;
  for (const auto of autos) {
    if (syncStatus.get(auto.fromCopperId) != null) continue;
    const hubspotAssociationKey = await hubspotApi.createAssociationLabel(auto.fromType, auto.toType, auto.name);
    await syncStatus.add(auto.fromCopperId, hubspotAssociationKey);
    console.log('Created', auto, 'With association key: ' + hubspotAssociationKey);
    created++;
  }
  return created;
}


function checkCustomsAndGetAuto() {
  const ignored = [];
  const auto = [];
  for (const [fromCopperId, fromCopperEntry] of Object.entries(customMap)) {
    const toCopperId = fromCopperEntry.toCopperId;
    fromCopperEntry.fromCopperId = fromCopperId;
    if (fromCopperEntry.hubspotAssociationKey !== null && customMap[toCopperId].hubspotAssociationKey !== null) {
      throw new Error('Ony one direction of associations defintion should be mapped in file data-hubspot/conf/custom_connections.json please check; \n' + 
      JSON.stringify(fromCopperEntry) + '\n and \n' + JSON.stringify(customMap[toCopperId]));
    } 
    const hubspotAssociationKey = fromCopperEntry.hubspotAssociationKey;
    if (hubspotAssociationKey === null && customMap[toCopperId].hubspotAssociationKey === null) {
      ignored.push(fromCopperEntry);
      continue;
    }
    if (hubspotAssociationKey === null) continue;
    if (hubspotAssociationKey === "auto") {
      auto.push(fromCopperEntry);
      continue;
    }
    if (currentAssociationsMap[hubspotAssociationKey] == null) {
      throw new Error('Cannot find hubspot corresponding entry for ' + JSON.stringify(fromCopperEntry));
    }
  }
  console.log('Custom checked Ignored: ' + ignored.length + ' autos: ' + auto.length);
  return auto;
}



async function initHubspot() {
  // 0- Prepare a map of all hubspot currentAssociations
  currentAssociations = await getAssociations();
  for (const [fromType, typeEntries] of Object.entries(currentAssociations)) {
    for (const [hubspotId, entry] of Object.entries(typeEntries)) {
      entry.fromType = fromType;
      currentAssociationsMap[hubspotId] = entry;
    }
  }
}

function initCopperCustoms() {
  for (const [fromType, typeEntries] of Object.entries(customAssociations)) {
    for (const [copperId, entry] of Object.entries(typeEntries)) {
      entry.fromType = fromType;
      customMap[copperId] = entry;
    }
  }
}