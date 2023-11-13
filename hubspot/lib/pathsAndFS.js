const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '../../data-hubspot');
fs.mkdirSync(dataPath, {recursive: true});

const dataCurrentPath = path.resolve(dataPath, 'current');
fs.mkdirSync(dataCurrentPath, {recursive: true});

const dataSourcePath = path.resolve(dataPath, 'source');
fs.mkdirSync(dataSourcePath, {recursive: true});

const dataConfPath = path.resolve(dataPath, 'conf');
fs.mkdirSync(dataConfPath, {recursive: true});

module.exports = {
  fs,
  path,
  dataPath,
  dataConfPath,
  dataCurrentPath,
  dataSourcePath
}