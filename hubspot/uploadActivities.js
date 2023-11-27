const { hubspotClient } = require('./lib/hubspotClient');
const { SyncStatus } = require('./lib/pathsAndFS');

const activies = require('../data-hubspot/source/activities.json');

const syncStatus = new SyncStatus('activities');

(async () => {
  const chunkSize = 100;
  for (const [type, entriesRaw] of Object.entries(activies)) {
    const entries = entriesRaw.filter((e) => syncStatus.get(e.copperId) == null);
    for (let i = 0; i < entries.length; i += chunkSize) {
      const entryChunk = entries.slice(i, i + chunkSize);
      const entryInput = entryChunk.map((e) => { return { properties: e.properties, associations: e.associations } });
      try {
        const res = await hubspotClient.crm.objects[type].batchApi.create({ inputs: entryInput });
        for (let j = 0; j < entryChunk.length; j++) {
          const resJ = res.results[j];
          if (!resJ.id) {
            console.log('Failed ', entryChunk[j], resJ);
          } else {
            syncStatus.add(entryChunk[j].copperId, resJ.id);
          }
        }
        console.log(type, (i + chunkSize) + '/' + entries.length);

      } catch (e) {
        console.log(e.body);
        console.log(entryChunk);
        process.exit(0);
      }

    }

  }
})();