/**
 * Prepare configuration for custom data mapping 
 * Will not "touch" existing mappings in confs files just add the new ones. 
 * Make sure to erase the configuration files if you have modifications such as new dropdown items (or complee manually)
 */

const {fs, path, dataConfPath} = require('./lib/pathsAndFS');

const customFields = require('../data/custom_field_definitions.json');

const connectionFile = path.resolve(dataConfPath, 'custom_connections.json');
const definitionFiles = path.resolve(dataConfPath, 'custom_def.json');

const data = fs.existsSync(definitionFiles) ? require(definitionFiles) : {};
const connects = fs.existsSync(connectionFile) ? require(connectionFile) : {};;

for (const cf of customFields.filter((c) => c.data_type === 'Connect')) {
  if (connects[cf.id + '']) continue;
  connects[cf.id + ''] = {
    name: cf.name,
    to: cf.connected_id + ''
  }
}

const mapType = {
  'company': 'company',
  'person': 'contact',
  'lead': 'contact',
  'opportunity': 'deal',
  'project': 'project'
}

for (const cf of customFields) {
  if (cf.data_type === 'Connect') continue; // ignore connections

  for (const type of cf.available_on) {
    if (data[mapType[type]] == null) data[mapType[type]] = {};
    if (data[mapType[type]][cf.id + '']) continue; // skip existing types

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
        def.handle = 'MapMulti';
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

    data[mapType[type]][cf.id + ''] = def;
  }
}



fs.writeFileSync(connectionFile, JSON.stringify(connects, null, 2));
fs.writeFileSync(definitionFiles, JSON.stringify(data, null, 2));