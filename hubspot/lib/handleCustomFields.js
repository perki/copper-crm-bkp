const fieldsDefs = require('../../data-hubspot/conf/fields_def.json');
const customDefs = require('../../data-hubspot/conf/custom_def.json');

function DateToString(timestamp) {
  return Date(timestamp).toString();
}

function Copy(s) {
  return s;
}

function MapItem(s, conf) {
  return conf[s + ''];
}

function MapItemToNum(s, conf) {
  return conf[s + ''].value;
}

function MapItemSELECT(s, conf) {
  if (conf[s + ''] == null)  throw new Error('Missing item ' + s + ' in ' + JSON.stringify(conf));
  return conf[s + ''].value;
}

function MapItemMULTI(arrayOfIds, conf) {
  const res = [];
  for (const itemIt of arrayOfIds) {
    if (conf[itemIt + ''] == null)  throw new Error('Missing item ' + itemIt + ' in ' + JSON.stringify(conf));
    const value = conf[itemIt + ''].value;
    if (value == null) throw new Error('Missing value for item ' + itemIt +' in ' + JSON.stringify(conf));
    res.push(value);
  }
  return res.join(';');
}

function MapMultiString(arrayOfIds, conf) {
  const res = [];
  for (const itemIt of arrayOfIds) {
    if (conf[itemIt + ''] == null)  throw new Error('Missing item ' + itemIt + ' in ' + JSON.stringify(conf));
    res.push(conf[itemIt + '']);
  }
  return res.join(', ');
}

function Bool(s) {
  console.log('Bool', s);
  return s;
}

function Num(s) {
  console.log('Num', s, conf);
  return s;
}

const handles = {
  DateToString,
  Copy,
  MapItem,
  MapItemSELECT,
  MapItemMULTI,
  MapMultiString,
  Bool,
  Num,
  Copy,
  MapItemToNum
}


function handleCustomFields(type, customFields, hubspotItem) {  
  for (const cf of customFields) {
    if (cf.value == null) continue;
    const def = customDefs[type][cf.custom_field_definition_id + ''];
    if (def == null) throw new Error('Cannot find customField def: ' + cf.custom_field_definition_id + ' for ' + type + '>' + JSON.stringify(cf));
    if (handles[def.handle] == null) throw new Error('Cannot find customField map Method:' + def.handle);

    const value = handles[def.handle](cf.value, def.conf);
    handleDest(def, value, hubspotItem);
    
  }
};

function handleFields(type, copperItem, hubspotItem) {
  const typeDef = fieldsDefs[type];
  if (! typeDef) return;
  for (const field of Object.keys(typeDef)) {
    if (! copperItem[field]) continue;
    const def = typeDef[field];
    const value = handles[def.handle](copperItem[field], def.conf);
    handleDest(def, value, hubspotItem);
    delete copperItem[field];
  }
}


function handleDest(def, value, hubspotItem) {
  switch (def.dest) {
    case 'extras.others':
      hubspotItem.extras.others.push(def.name + ': ' + value);
      break;
    case 'extras.websites':
      hubspotItem.extras.websites.push(def.name + ': ' + value);
      break;
    default:
      hubspotItem[def.dest] = value;
  }
}

module.exports = {
  handleCustomFields,
  handleFields
}

