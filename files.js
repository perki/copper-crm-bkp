const superagent = require('superagent');
const https = require("https");
const fs = require('fs');
const path = require('path');

const COMPANY = process.env.COPPER_COMPANY
const COOKIES = process.env.COPPER_COOKIES

if (!COMPANY) throw new Error('COPPER_COMPANY environement variable missing');
if (!COOKIES) throw new Error('COPPER_COOKIES environement variable missing');

const HEADERS = {
  'Cookie': COOKIES
};

fs.mkdirSync(path.resolve(__dirname, './data/files'), { recursive: true });

function getFile(url, filePath) {


  return new Promise((resolve, reject) => {
    let rejected = false;
    function err(e) {
      
      if (rejected) return;
      rejected = true;
     
      fs.unlinkSync(filePath);
      console.log('Error', e);
      reject(e);
    }

    https.get(url, (res) => {
      const writeStream = fs.createWriteStream(filePath);
      res.pipe(writeStream);
      res.on('error', (e) => { try { writeStream.close(); } catch (e) { }; err(e); });
      writeStream.on('error', (e) => { try { writeStream.close(); } catch (e) { }; err(e); });

      writeStream.on('finish', () => {
        console.log('Download Completed!', filePath);
        resolve()
      });
    }).on('error', (e) => { err(e); });
  });
}

function gatherAllFiles() {
  const allFilePath = path.resolve(__dirname, './data/allFiles.json');
  if (fs.existsSync(allFilePath)) return require('./data/allFiles.json');
  const allFiles = [];
  const dir = path.resolve(__dirname, './data');
  fs.readdirSync(path.resolve(dir)).forEach(fileName => {
    const fileDirectory = path.join(dir, fileName);
    if (! (fs.statSync(fileDirectory).isDirectory() && fileDirectory.endsWith('-files'))) return;

    fs.readdirSync(path.resolve(fileDirectory)).forEach(fileName2 => {
      const filePath = path.join(fileDirectory, fileName2);
      if (!filePath.endsWith('.json')) return;
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      allFiles.push(...content);
    });
  });
  fs.writeFileSync(allFilePath, JSON.stringify(allFiles, null, 2));
  return allFiles;
}



(async () => {
  const files = gatherAllFiles();

  for (const file of files) {
    const filePath = path.resolve(__dirname, './data/files/', file.id + '-' + file.file_name);
    if (fs.existsSync(filePath) || file.content_type.startsWith('application/vnd.google-apps')) continue;
    try { 
      const res = await superagent.get('https://app.copper.com/api/v1/companies/' + COMPANY + '/file_documents_api/' + file.id + '/download').set(HEADERS);
      // console.log(res.redirects[0]);
      await getFile(res.redirects[0], filePath);
    } catch (e) {
      console.log(e.message, file);
    }
  }
})();
