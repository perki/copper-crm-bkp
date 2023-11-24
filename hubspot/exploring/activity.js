
// Parent 9073907145
// Child 9073947892

const { hubspotClient, hubspotApi } = require('../lib/hubspotClient');

const notes = [
  {
    "properties": {
      "hs_communication_channel_type": "LINKEDIN_MESSAGE",
      "hs_communication_logged_from": "CRM",
      "hs_communication_body": "----- Conversation ---- \nPierre-Mikael Legris - 12/02/2021 14:43\nBonjour Arthur, \nBravo pour le succès de OneDoc!\nPlanifiez-vous d'étendre votre service et de developper une offre de télémedecine et de gestion de donnée médicale? \nSi c'était le cas, je serait heureux de pouvoir vous présenter Pryv, notre technologie et nos services. \nPierre-Mikael".replaceAll('\n', '<br>'),
      "hs_timestamp": 1638456231000,
      "hubspot_owner_id": "1498286840"
    },
    "associations": [
      {
        "to": {
          "id": "351"
        },
        "types": [
          {
            "associationCategory": "HUBSPOT_DEFINED",
            "associationTypeId": 81
          }
        ]
      },
      {
        "to": {
          "id": "9073833695"
        },
        "types": [
          {
            "associationCategory": "HUBSPOT_DEFINED",
            "associationTypeId": 87
          }
        ]
      }
    ],
}];


(async () => {

  const res = await hubspotClient.crm.objects.communications.batchApi.create({inputs: notes});
  console.log(JSON.stringify(res, null, 2));
})();

