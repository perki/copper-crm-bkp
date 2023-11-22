
// Parent 9073907145
// Child 9073947892

const { hubspotClient, hubspotApi } = require('../lib/hubspotClient');


(async () => {
  //await hubspotApi.createLabel('deal', 'contact', 'Also involved');

})();



async function createAssociation() {
  const res = await hubspotClient.crm.associations.v4.basicApi.create(
    'companies',
    '9073907145', // parent
    'companies',
    '9073947892', // child
    [
      {
        "associationCategory": "HUBSPOT_DEFINED",
        "associationTypeId": 13
      }
    ]
  );
  console.log(res);
}
