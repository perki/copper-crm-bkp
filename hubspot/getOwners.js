const {fs, path, dataCurrentPath, dataConfPath} = require('./lib/pathsAndFS');
const hubspotClient = require('./lib/hubspotClient');

async function getOwners() {
  const body = await hubspotClient.crm.owners.ownersApi.getPage();
  const owners = body.results;
  fs.writeFileSync(path.resolve(dataCurrentPath, 'owners.json'), JSON.stringify(owners, null, 2));
  console.log('Got ' + owners.length + ' owners');

  // init conf if not exists
  const ownersMapPath = path.resolve(dataConfPath, 'ownersMap.json');
  const initConfMap = [];
  if (fs.existsSync(ownersMapPath)) {
    const current = require(ownersMapPath);
    initConfMap.push(...current);
  } 
  for (const owner of owners) {
    if (initConfMap.find((i) => owner.id === i.hubspot?.id)) continue;
    initConfMap.push({copper: null, hubspot: owner});
    console.log('Added to conf: ' + owner.email);
  } 
  fs.writeFileSync(ownersMapPath, JSON.stringify(initConfMap, null, 2));
};

getOwners();