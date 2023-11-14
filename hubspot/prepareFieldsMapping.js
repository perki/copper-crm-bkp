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


for (const cf of customFields) {
  for (const type of cf.available_on) {
    if (data[type] == null) data[type] = {};
    if (data[type][cf.id + '']) continue; // skip existing types

    const def = {
      name: cf.name,
      dest: 'extras'
    }
    switch (cf.data_type) {
      case 'String':
        def.handle = 'Copy';
        break;
      case 'Date':
        def.handle = 'DateToString'
        break;
      case 'Dropdown':
        def.handle = 'Map'
        def.conf = {};
        for (const o of cf.options) {
          def.conf[o.id + ''] = o.name;
        }
        break;
      case 'Multiselect':
        def.handle = 'MapMulti'
        def.conf = {};
        for (const o of cf.options) {
          def.conf[o.id + ''] = o.name;
        }
        break;
      case 'Connect':
        // ignore ??
        break;
      case 'Checkbox':
        def.handle = 'Bool'
        break;
      case 'Float':
        def.handle = 'Number'
        break;
      default:
        console.log('Unkown type: ' + def.data_type)
    }

    data[type][cf.id + ''] = def;
  }
}

fs.writeFileSync(connectionFile, JSON.stringify(connects, null, 2));
fs.writeFileSync(definitionFiles, JSON.stringify(data, null, 2));