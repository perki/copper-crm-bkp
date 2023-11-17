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

const dataPropertiesPath = path.resolve(dataPath, 'properties');
fs.mkdirSync(dataPropertiesPath, {recursive: true});

const syncStatusPath = path.resolve(dataPath, 'sync-status');
fs.mkdirSync(syncStatusPath, {recursive: true});


class SyncStatus {
  data;
  stream;
  constructor (name) {
    const syncFile = path.resolve(syncStatusPath, name + '.sync');
    this.data = {};
    if (fs.existsSync(syncFile)) {
      const content = fs.readFileSync(syncFile, 'utf8');
      if (content != null) {
        const lines = content.split('\n');
        for (const line of lines) {
          const s = line.indexOf(':');
          if (s < 0 ) continue;
          const key = line.substring(0, s);
          const value = line.substring(s + 1);
          this.data[key] = JSON.parse(value);
        }
    }
    }
    this.stream = fs.createWriteStream(syncFile, {flags:'a'});
  }

  get (key) {
    return this.data[key + ''];
  }

  add (key, value) {
    let myData = this.data;
    return new Promise((resolve, reject) => { 
        this.stream.write(key + ':' + JSON.stringify(value) + '\n', 'utf8', function(error) {
        if (error) return reject(error);
        myData[key + ''] = value;
        resolve();
      });
    });
  }

  close () {
    this.stream.close();
  }
}


module.exports = {
  fs,
  path,
  dataPath,
  dataConfPath,
  dataCurrentPath,
  dataSourcePath,
  dataPropertiesPath,
  SyncStatus
};