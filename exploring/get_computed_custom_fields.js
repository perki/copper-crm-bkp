custom_field_computed_values=true

const superagent = require('superagent');

const APIKEY = process.env.COPPER_APIKEY
const APIEMAIL = process.env.COPPER_EMAIL
if (! APIKEY) throw new Error('COPPER_APIKEY environement variable missing');
if (! APIEMAIL) throw new Error('COPPER_APIEMAIL environement variable missing');

const HEADERS = {
  'X-PW-AccessToken': APIKEY,
  'X-PW-Application': 'developer_api',
  'X-PW-UserEmail': APIEMAIL,
  'Content-Type': 'application/json'
 };

async function apiGet(myPath, data = {}) {
  try {
    console.log(myPath);
    const res = await superagent.get('https://api.copper.com/developer_api/v1/' + myPath).set(HEADERS).query(data);
    //console.log(res);
    return res.body;
  } catch (e) {
    console.log(e.message, myPath, data);
  }
};

(async () => {
  companyId = 50711392;
  const res = await apiGet('related_links/', {
    custom_field_definition_id: 353217,
    source_id: 86898963,
    source_type: 'people'
  });
  console.log(res);
})();