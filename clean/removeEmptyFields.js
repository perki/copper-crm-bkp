/**
 * Remove all files containing only an empty array.
 */

const path = require("path");
const fs   = require("fs");

function inspect(o) {
  if (o == null) {
    return false;
  }
  if (Array.isArray(o)) {
    const l = o.length -1;
    for (let i = l; i > -1 ; i--) {
      if (! inspect(o[i])) delete o[i];
    }
    return (o.length > 0);
  };
  if (typeof o === 'object') {
    let empty = true;
    for (const k of Object.keys(o)) {
      if (k === 'custom_fields') { // specifc case for 'custom_fields'
        o.custom_fields = o.custom_fields.filter((cf) => inspect(cf.value));
        if (o.custom_fields.length === 0) {
          delete o.custom_fields;
        } else {
          empty = false;
        }
      } else { // generic case
        if (! inspect(o[k])) {
          delete o[k];
        } else {
          empty = false;
        }
      }
    }
    return !empty;
  }
  return true;
}


function loop(dir, destDir) {
  fs.mkdirSync(path.resolve(__dirname, destDir), {recursive: true});
  fs.readdirSync(dir).forEach(fileName => {
      const fullPath = path.join(dir, fileName);
      const destFullPath = path.join(destDir, fileName);
      if (fs.statSync(fullPath).isDirectory()) {
        return loop(fullPath, destFullPath);
      }
      if (fileName.endsWith('.json')) {
        const contentStr = fs.readFileSync(fullPath, 'utf-8');
        const content = JSON.parse(contentStr);
        inspect(content);
        const cleanedStr = JSON.stringify(content, null, 2);
        if (contentStr.length != cleanedStr.length) {
          console.log('Cleaned ', fileName, contentStr.length +' => '+ cleanedStr.length);
          fs.writeFileSync(destFullPath, cleanedStr);
        }
      }
     
  });
}

const sourcePath = path.resolve(__dirname, '../data');
const destPath = path.resolve(__dirname, '../data');

loop(sourcePath, destPath);