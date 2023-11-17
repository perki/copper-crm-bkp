
const { fs, path, tempPath} = require('../lib/pathsAndFS');
const hubspotClient = require('../lib/hubspotClient');

const publicObjectSearchRequest = {
  filterGroups: [
  {
      filters: [
      {
          propertyName: 'email',
          operator: 'NOT_HAS_PROPERTY',
      },
      {
        propertyName: 'work_email',
        operator: 'HAS_PROPERTY',
      }
      ] 
  }
  ],
  properties: ['email', 'work_email', 'id'],
  limit: 100,
  after: 0,
};

(async () => {
  const results = [];
  try {
    do {
      const response = await hubspotClient.crm.contacts.searchApi.doSearch(publicObjectSearchRequest)
      await new Promise((r) => {setTimeout(r, 500)});
      results.push(...response.results);
      publicObjectSearchRequest.after += 100;
      console.log(publicObjectSearchRequest.after);
      if (response.results.length === 0) publicObjectSearchRequest.after = -1;
    } while (publicObjectSearchRequest.after > 0);
  } catch (e) { console.log(e); }
  fs.writeFileSync(path.resolve(tempPath, 'search.json'), JSON.stringify(results, null, 2));
})();
