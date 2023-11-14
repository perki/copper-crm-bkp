/**
 * Remove all files containing only an empty array.
 */

const path = require("path");
const fs   = require("fs");

function loop(dir) {
  fs.readdirSync(dir).forEach(fileName => {
      const fullPath = path.join(dir, fileName);
      if (fs.statSync(fullPath).isDirectory()) return loop(fullPath);
      if (fileName.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.length < 4 && content === '[]') {
          fs.unlinkSync(fullPath);
          console.log('Removed: ' + fullPath);
        }
      }
  });
}

loop(path.resolve(__dirname, '../data'));