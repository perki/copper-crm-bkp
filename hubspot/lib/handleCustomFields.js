
function DateToString(timestamp) {
  return Date(timestamp).toString();
}

function Copy(s) {
  return s;
}

function MapItem(s, conf) {
  return conf[s + ''];
}

function MapMulti(s, conf) {
  console.log('MapMulti', s, conf);
  throw new Error('Not implemented');
  return s;
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
  MapMulti,
  Bool,
  Num,
  Copy
}

const defs = require('../../data-hubspot/conf/custom_def.json');

module.exports = function handleCustomFields(type, customFields, hubspotItem) {  
  for (const cf of customFields) {
    if (cf.value == null) continue;
    const def = defs[type][cf.custom_field_definition_id + ''];
    if (def === null) throw new Error('Cannot find customField def: ' + cf.custom_field_definition_id + ' for ' + type);
    
    const value = handles[def.handle](cf.value, def.conf);

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

};