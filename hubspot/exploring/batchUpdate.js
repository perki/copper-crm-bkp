const { fs, path, tempPath} = require('../lib/pathsAndFS');
const { hubspotClient } = require('../lib/hubspotClient');

const items = require('../../data-hubspot/temp/search.json');

const batchData = items.map((i) => {
  return {id: i.id, properties: { email: i.properties.work_email }}
});

(async () => {
  for (let i = 0; i < batchData.length; i += 100) {
    const chunck = batchData.slice(i, i + 100);
    const res = await hubspotClient.crm.contacts.batchApi.update({ inputs: chunck });
    console.log(res);
    console.log(i);
  }
})();
