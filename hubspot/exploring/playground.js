const hubspot = require('@hubspot/api-client');

const contactProperties = require('../../data-hubspot/properties/contacts.json').map((p) => p.name);
const companiesProperties = require('../../data-hubspot/properties/companies.json').map((p) => p.name);


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
  //const items = await hubspotClient.crm.contacts.getAll();
  const items = await hubspotClient.crm.companies.getAll(10, undefined, companiesProperties);
  console.log(JSON.stringify(items, null, 2));

  // const owners = await hubspotClient.crm.owners.ownersApi.getPage();
  //console.log(JSON.stringify(owners, null, 2));
};

go();