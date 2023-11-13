const hubspot = require('@hubspot/api-client');


const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
if (! HUBSPOT_TOKEN) throw new Error('HUBSPOT_TOKEN environement variable missing');


const hubspotClient = new hubspot.Client({ accessToken: HUBSPOT_TOKEN });

async function go() {
  const contactObj = {
      id: '151',
      properties: {
        email: 'bob@bob.com', 
        firstname: 'Perki',
        lastname: 'Ikrep',
      },
  };
  //const createContactResponse = await hubspotClient.crm.contacts.basicApi.create(contactObj);
  //console.log(createContactResponse);
  //const updateContactResponse = await hubspotClient.crm.contacts.batchApi.update({inputs: [contactObj]});
  //console.log(updateContactResponse);
  const conatcts = await hubspotClient.crm.contacts.getAll();
  console.log(JSON.stringify(conatcts, null, 2));
};

go();