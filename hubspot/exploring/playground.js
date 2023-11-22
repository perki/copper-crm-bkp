
const { hubspotClient } = require('./lib/hubspotClient');
const contactProperties = require('../../data-hubspot/properties/contacts.json').map((p) => p.name);
const companiesProperties = require('../../data-hubspot/properties/companies.json').map((p) => p.name);

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
  const items = await hubspotClient.crm.contacts.getAll(10, undefined, contactProperties);
  //const items = await hubspotClient.crm.companies.getAll(10, undefined, companiesProperties);
  console.log(JSON.stringify(items, null, 2));

  // const owners = await hubspotClient.crm.owners.ownersApi.getPage();
  //console.log(JSON.stringify(owners, null, 2));
};

go();