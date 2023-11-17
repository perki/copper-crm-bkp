
const { pluralMap } = require('./lib/typeMaps');
const { fs, path, dataSourcePath } = require('./lib/pathsAndFS');

for (const [type, typePlural] of Object.entries(pluralMap)) {
  const sourceFile = path.resolve(dataSourcePath, typePlural +'.json');
  if (! fs.existsSync(sourceFile)) continue;
  const items = require(sourceFile);

  const propsList = require('../data-hubspot/properties/' + typePlural + '.json');
  const propMap = {};
  for (const p of propsList) { propMap[p.name] = p; }

  let missings = {};
  for (const item of items) {
    for (const field of Object.keys(item)) {
     if (field !== '_transitional' && propMap[field] == null) {
      if (! missings[field]) missings[field] = 0;
      missings[field]++;
     }
    }
  }
  console.log('Checked ' + type + ' unkown properties ', missings);
}

