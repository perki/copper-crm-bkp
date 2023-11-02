const superagent = require('superagent');
const fs = require('fs');

let callsCount = 0;
let waitBetweenCalls = 1800;
const checkRateMs = 10*1000;
const maxCallsMinute = 170; // Max 180
const expectedCallTimeMSec = 60 * 1000 / maxCallsMinute;

const APIKEY = process.env.COPPER_APIKEY
const APIEMAIL = process.env.COPPER_EMAIL

if (! APIKEY) throw new Error('COPPER_APIKEY environement variable missing');
if (! APIEMAIL) throw new Error('COPPER_APIEMAIL environement variable missing');

const HEADERS = {
  'X-PW-AccessToken': APIKEY,
  'X-PW-Application': 'developer_api',
  'X-PW-UserEmail': APIEMAIL,
  'Content-Type': 'application/json'
 };

 const entityMap = {
  'companies': 'company',
  'people': 'person',
  'opportunities': 'opportunity',
  'projects': 'project',
  'tasks': 'task',
  'leads': 'lead'
};

let done = false;

(async () => {
  let lastStart = 0;
  while (!done && (Date.now() - lastStart) > 5000 ) { // retry if last start was more than 5 seconds ago
    lastStart = Date.now();
    try {
      await bkpCopper();
    } catch (e) {
      console.log(e);
      console.log('*********** RETRYING **********');
    }
  }
})();

async function bkpCopper () {
  // this sequencial, we can start with no rate limiting
  waitBetweenCalls = 150;
  for (const item of [
    'account', 'lead_statuses', 'contact_types', 'customer_sources', 
    'loss_reasons', 'pipelines', 'pipeline_stages', 'tags', 
    'activity_types', 'custom_activity_types', 'custom_field_definitions'
  ]) {
    await getSave(item);
  }
  for (const item of Object.keys(entityMap)) {
    await getItem(item);
  }
  await Promise.all([

  ]);
  const promises = [];
  for (const item of Object.keys(entityMap)) {
    promises.push(getActivities(item));
    promises.push(getRelated(item, 'related'));
    if (item != 'tasks') promises.push(getRelated(item, 'files'));
  }
  // this is done in parallel, we can set rate limiting to a higher value 
  waitBetweenCalls = 2000;
  await Promise.all(promises);
  done = true;
};

/**
 * Check rate is called every 10 seconds, it avoids being over the 180 calls/minutes
 * The logic is pretty weak but does the job, feel free to rewrite ;)
 */
async function checkRate() {
  const actualCallrateMin = (60 * 1000 / checkRateMs) * callsCount;
  const actualCallTimeMSec = checkRateMs / (callsCount + 0.0001);
  waitBetweenCalls += (expectedCallTimeMSec - actualCallTimeMSec) * (actualCallrateMin / maxCallsMinute);
  console.log('Average callTime: ' + pretty(actualCallTimeMSec) + ' expected: ' + pretty(expectedCallTimeMSec) );
  if (waitBetweenCalls < 0) waitBetweenCalls = 0;
  //if (waitBetweenCalls > expectedCallTimeMSec) waitBetweenCalls = expectedCallTimeMSec;
  
  console.log('Call Rate: ' + pretty(actualCallrateMin) + ' wait: ' + pretty(waitBetweenCalls / 1000));
  callsCount = 0;
  if (! done) setTimeout(checkRate, checkRateMs);
}
setTimeout(checkRate, checkRateMs);

function pretty(num) {
  return Math.round(num * 100) / 100;
}

async function waitOrNot() {
  if (waitBetweenCalls > 0) {
    await new Promise(resolve => setTimeout(resolve, waitBetweenCalls));
  }
  callsCount++;
}

async function apiPost(path, data) {
  try {
    await waitOrNot();
    const res = await superagent.post('https://api.copper.com/developer_api/v1/' + path).set(HEADERS).send(data);
    return res.body;
  } catch (e) {
    throw new Error(e.message + ' ' + e.response?.text + ' ' + path + ' ' + JSON.stringify(data));
  }
}

async function apiPostPaginated(path, data = {}) {
  let entityList = []; 
  for (let i = 1; i < 10000; i++ ) {
    const page = await apiPost(path, Object.assign({page_number: i, 'page_size': 200}, data));
    console.log(path + ' page: ' + i , data);
    entityList.push(...page);
    if (page.length < 200) break;
  } 
  return entityList;
}

async function apiGet(path, data = {}) {
  try {
    console.log(path);
    await waitOrNot();
    const res = await superagent.get('https://api.copper.com/developer_api/v1/' + path).set(HEADERS).query(data);
    return res.body;
  } catch (e) {
    console.log(e.message, path, data);
  }
}

async function getSave(what) {
  const path = 'data/' + what + '.json';
  if (fs.existsSync(path)) return;
  const item = await apiGet(what);
  fs.writeFileSync(path, JSON.stringify(item, null, 2));
}

async function getItem(entityName) {
  if (fs.existsSync('data/' + entityName + 'List.json')) return;
  const entityList = await apiPostPaginated(entityName + '/search', {});
  fs.writeFileSync('data/' + entityName + 'List.json', JSON.stringify(entityList, null, 2));
}

async function getActivities(entityName) {
  // randomize start to avoid 20 calls is the first second
  await new Promise(resolve => setTimeout(resolve, Math.random()*2000));
  const entityList = require('./data/' + entityName + 'List.json');
  fs.mkdirSync('data/' + entityName  + 'Activities/', { recursive: true });
  const type = entityMap[entityName];

  for (const entity of entityList) {
    const path = 'data/' + entityName + 'Activities/' + entity.id + '.json';
    if (fs.existsSync(path)) continue;
    const parent = {type, id: entity.id}
    const activities = await apiPostPaginated('activities/search', {parent});
    fs.writeFileSync(path, JSON.stringify(activities, null, 2));
  }
}

async function getRelated(entityName, fileOrRelated) {
  // randomize start to avoid 20 calls is the first second
  await new Promise(resolve => setTimeout(resolve, Math.random()*2000));
  const entityList = require('./data/' + entityName + 'List.json');
  const basePath = 'data/' + entityName  + '-' + fileOrRelated + '/';
  fs.mkdirSync(basePath, { recursive: true });
  const type = entityMap[entityName];

  for (const entity of entityList) {
    const path = basePath + entity.id + '.json';
    if (fs.existsSync(path)) continue;
    const related = await apiGet(entityName + '/' + entity.id + '/' + fileOrRelated);
    fs.writeFileSync(path, JSON.stringify(related, null, 2));
  }
}