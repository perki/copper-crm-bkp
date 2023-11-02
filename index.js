const superagent = require('superagent');
const fs = require('fs');

const APIKEY = process.env.COPPER_APIKEY
const APIEMAIL = process.env.COPPER_EMAIL

if (! APIKEY) throw new Error('COPPER_APIKEY environenemnt variable missing');
if (! APIEMAIL) throw new Error('COPPER_APIEMAIL environenemnt variable missing');

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

(async () => {
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
  for (const item of Object.keys(entityMap)) {
    await getActivities(item);
  }
  for (const item of Object.keys(entityMap)) {
    await getRelated(item, 'related');
    await getRelated(item, 'files');
  }
})();

let callsCount = 0;
let waitBetweenCalls = 0;
const checkRateMs = 10*1000;
const maxCallsMinute = 30;
const expectedCallTimeMSec = 60 * 1000 / maxCallsMinute;
/**
 * Check rate is called every 10 seconds, it avoids being over the 180 calls/minutes
 */
async function checkRate() {
  const actualCallTimeMSec = checkRateMs / (callsCount + 0.0001);
  waitBetweenCalls += expectedCallTimeMSec - actualCallTimeMSec;
  console.log('Actual callTime: ' + actualCallTimeMSec + ' expected: ' + expectedCallTimeMSec);
  if (waitBetweenCalls < 0) waitBetweenCalls = 0;
  if (waitBetweenCalls > expectedCallTimeMSec) waitBetweenCalls = expectedCallTimeMSec;
  const actualCallrateMin = (60 * 1000 / checkRateMs) * callsCount;
  console.log('Call Rate: ' + actualCallrateMin + ' wait: ' + waitBetweenCalls / 1000);
  callsCount = 0;
  setTimeout(checkRate, checkRateMs);
}
checkRate();

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
    console.log(e.message);
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