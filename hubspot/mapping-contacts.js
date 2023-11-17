const { fs, path, dataCurrentPath, dataConfPath, dataSourcePath } = require('./lib/pathsAndFS');

const { handleCustomFields, handleFields } = require('./lib/handleCustomFields');

const customerSourceIdsMap = {};
for (const cs of require('../data/customer_sources.json')) {
  customerSourceIdsMap[cs.id + ''] = cs.name;
}

let umatchedFields = {};

const convertConfs = {
  contact: require('./maps/contact'),
  company: require('./maps/company')
}

function convert(type, item) {
  const conv = convertConfs[type];
  const copperItem = structuredClone(item);
  const hubspotItem = { extras: { }};

  // -- 1 => 1 matching
  for (const [copperKey, hubspotKey] of Object.entries(conv.directs)) {
    if (copperKey.indexOf('.') > 0) { // support only one level of dot
      const [key1, key2] = copperKey.split('.');
      if (copperItem[key1] == null || copperItem[key1][key2] == null) continue;
      hubspotItem[hubspotKey] = copperItem[key1][key2];
      delete copperItem[key1][key2];
      continue; 
    }
    if (copperItem[copperKey] == null) continue;
    hubspotItem[hubspotKey] = copperItem[copperKey];
    delete copperItem[copperKey];
  }

  // -- Function call
  for (const [copperKey, method] of Object.entries(conv.methods)) {
    if (copperItem[copperKey] == null) continue;
    method(copperItem[copperKey], hubspotItem);
    delete copperItem[copperKey];
  }

  // -- Ignores
  for (const copperKey of conv.ignores) {
    delete copperItem[copperKey];
  }

  // -- Map into description 
  if (hubspotItem.extras.others == null) hubspotItem.extras.others = [];
  for (const [copperKey, action] of Object.entries(conv.others)) {
    if (copperItem[copperKey] == null) continue;
    if (action === 'date') {
      hubspotItem.extras.others.push(copperKey + ': ' + Date(copperItem[copperKey]).toString());
    } else { 
      hubspotItem.extras.others.push(copperKey + ': ' + copperItem[copperKey]);
    }
    delete copperItem[copperKey];
  }

  // tags
  if (copperItem.tags && copperItem.tags.length > 0) {
    hubspotItem.tags = copperItem.tags.map((t) => t.replaceAll(',', '_')).join(', ');
    delete copperItem.tags;
  }

  // id 
  hubspotItem.copperid = copperItem.id;
  delete copperItem.id;

  // custom fields
  if (copperItem.custom_fields) {
    handleCustomFields(type, copperItem.custom_fields, hubspotItem);
    delete copperItem.custom_fields;
  }

  handleFields(type, copperItem, hubspotItem);

  // cleanup empty fields
  for (const k of Object.keys(hubspotItem)) {
    const v = hubspotItem[k];
    if (v == null || (Array.isArray(v) && v.length === 0)) {
      delete hubspotItem[k];
      continue;
    }
  }

  // extras => description
  const notes = [];
  for (const key of Object.keys(hubspotItem.extras)) {
    const entries = hubspotItem.extras[key];
    if (entries.length === 0) continue;
    notes.push('**** ' + key + ' ****\n' + entries.join('\n'));
  }
  delete hubspotItem.extras;

  hubspotItem.description = '>>> AT IMPORT FROM COPPER ' + Date().toString() + ' <<<\n\n';
  
  if (copperItem.details) hubspotItem.description += copperItem.details + '\n\n';
  delete copperItem.details;

  if (notes.length > 0) {
    hubspotItem.description += notes.join('\n\n');
  }

  // count unmatched fields
  for (const k of Object.keys(copperItem)) {
    const item = copperItem[k];
    if (item == null) continue;
    if (Array.isArray(item) && item.length === 0) continue;
    if (JSON.stringify(item) === '{}') continue;
    if (umatchedFields[k] == null) umatchedFields[k] = 0;
    umatchedFields[k]++;
  }

  return hubspotItem;
};


if (true) {
  let umatchedFields = {};
  const people = require('../data/peopleList.json');
  const contacts = people.map((p) => convert('contact', p));
  const leads = require('../data/leadsList.json');
  contacts.push(...leads.map((p) => convert('contact', p)));

  const hubDest = path.resolve(dataSourcePath, 'contacts.json');
  fs.writeFileSync(hubDest, JSON.stringify(contacts, null, 2));
  console.log('contacts', {umatchedFields});
}

if (true) {
  let umatchedFields = {};
  const people = require('../data/companiesList.json');
  const companies = people.map((p) => convert('company', p));
  
  const hubDest = path.resolve(dataSourcePath, 'companies.json');
  fs.writeFileSync(hubDest, JSON.stringify(companies, null, 2));
  console.log('company', {umatchedFields});
}


