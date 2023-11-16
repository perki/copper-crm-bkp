/**
 * Prepare configuration for custom data mapping 
 * Will not "touch" existing mappings in confs files just add the new ones. 
 * Make sure to erase the configuration files if you have modifications such as new dropdown items (or complee manually)
 */
const slug = require('slug');
const {fs, path, dataConfPath} = require('./lib/pathsAndFS');

const customFields = require('../data/custom_field_definitions.json');

const connectionFile = path.resolve(dataConfPath, 'custom_connections.json');
const customDefFiles = path.resolve(dataConfPath, 'custom_def.json');
const fieldsDefFiles = path.resolve(dataConfPath, 'fields_def.json');

const fieldsDef = fs.existsSync(fieldsDefFiles) ? require(fieldsDefFiles) : {};
const customDef = fs.existsSync(customDefFiles) ? require(customDefFiles) : {};
const connects = fs.existsSync(connectionFile) ? require(connectionFile) : {};;

const mapType = {
  'company': 'company',
  'person': 'contact',
  'lead': 'contact',
  'opportunity': 'deal',
  'project': 'project'
}

// ----- custom fields --------- //

// extract Connect fields
for (const cf of customFields.filter((c) => c.data_type === 'Connect')) {
  if (connects[cf.id + '']) continue;
  connects[cf.id + ''] = {
    name: cf.name,
    to: cf.connected_id + ''
  }
}

for (const cf of customFields) {
  if (cf.data_type === 'Connect') continue; // ignore connections

  for (const type of cf.available_on) {
    if (customDef[mapType[type]] == null) customDef[mapType[type]] = {};
    if (customDef[mapType[type]][cf.id + '']) continue; // skip existing types

    const def = {
      name: cf.name,
      dest: 'extras.others'
    }
    switch (cf.data_type) {
      case 'String':
        def.handle = 'Copy';
        break;
      case 'Date':
        def.handle = 'DateToString';
        break;
      case 'Dropdown':
        def.handle = 'MapItem';
        def.conf = {};
        for (const o of cf.options) {
          def.conf[o.id + ''] = o.name;
        }
        break;
      case 'MultiSelect':
        def.handle = 'MapMultiString';
        def.conf = {};
        for (const o of cf.options) {
          def.conf[o.id + ''] = o.name;
        }
        break;
      case 'Checkbox':
        def.handle = 'Bool';
        break;
      case 'Float':
        def.handle = 'Num';
        break;
      case 'URL':
        def.handle = 'Copy';
        def.dest = 'extra.websites';
        break;
      default:
        console.log('Unkown type: ', cf)
    }

    customDef[mapType[type]][cf.id + ''] = def;
  }
}


// ------ contacts ------------  //
if (! fieldsDef.contact) fieldsDef.contact = {};
if (! fieldsDef.contact?.contact_type_id) {
  const copperContactTypes = require('../data/contact_types.json');

  const conf = {};
  for (const cct of copperContactTypes) {
    conf[cct.id + ''] = {
      label: cct.name,
      value: slug(cct.name, '_').toUpperCase()
    }
  }
  fieldsDef.contact.contact_type_id = {
    name: 'Contact Type',
    dest: 'copper_contact_type',
    handle: 'MapItemSELECT',
    fieldType: 'select',
    conf
  };
}

if (! fieldsDef.contact?.status_id) {
  const copperLeadStatuses = require('../data/lead_statuses.json');
  const hubspotDefaultMap = {
    '1000860': 'NEW',
    '1000861': 'OPEN', // Qualified
    '1000861': 'IN_PROGRESS',
    '1000862': 'UNQUALIFIED'
  }


  const conf = {};
  for (const cls of copperLeadStatuses) {
    conf[cls.id + ''] = {
      label: cls.name,
      value: hubspotDefaultMap[cls.id + ''] || slug(cls.name, '_').toUpperCase()
    }
  }
  fieldsDef.contact.status_id = {
    name: 'Lead Status',
    dest: 'hs_lead_status',
    groupName: 'sales_properties',
    fieldType: 'radio',
    handle: 'MapItemSELECT',
    conf
  };
}

if (! fieldsDef.contact?.customer_source_id) {
  const conf = {};
  for (const cs of require('../data/customer_sources.json')) {
    conf[cs.id + ''] = {
      label: cs.name,
      value: slug(cs.name, '_').toUpperCase()
    }
  }
  fieldsDef.contact.customer_source_id = {
    name: 'Customer Source',
    dest: 'customer_source',
    groupName: 'sales_properties',
    fieldType: 'select',
    handle: 'MapItemSELECT',
    conf
  };
}

fs.writeFileSync(connectionFile, JSON.stringify(connects, null, 2));
fs.writeFileSync(customDefFiles, JSON.stringify(customDef, null, 2));
fs.writeFileSync(fieldsDefFiles, JSON.stringify(fieldsDef, null, 2));