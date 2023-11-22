const {fs, path, SyncStatus} = require('./lib/pathsAndFS');
const { hubspotClient } = require('./lib/hubspotClient');

const syncStatuses = {};

async function upload(typePlural, foreachItem) {
  const items = require('../data-hubspot/source/' + typePlural + '.json');
  const syncStatus = new SyncStatus(typePlural);
  let r = items.length;
  for (const item of items) {
    r--;
    if (syncStatus.get(item.copperid) != null) continue;
    if (foreachItem != null) foreachItem(item);

    delete item._transitional;
    try {
      const res = await hubspotClient.crm[typePlural].basicApi.create({properties: item});
      await syncStatus.add(item.copperid, res.id);
      console.log(typePlural, r, item.name || res.id);
    } catch (e) {
      console.log('On item', item);
      console.log('Error', e.body );
      try { syncStatus.close(); } catch (e) { }
      process.exit(1);
    }
  }
  syncStatus.close();
  syncStatuses[typePlural] = syncStatus.data;
}



async function flow() {
  await upload('companies');
  await upload('contacts', function(item) {
     // add 'associatedcompanyid': to contacts and remove copper_company_id
    if (item._transitional.copperCompanyId == null) return;
    const hubspotCompanyId = syncStatuses.companies[item._transitional.copperCompanyId];
    if (hubspotCompanyId == null) throw new Error('Cannot find synchronized copperCompanyId ' + item._transitional.copperCompanyId);
    item.associatedcompanyid = hubspotCompanyId;
  });
}

flow();



