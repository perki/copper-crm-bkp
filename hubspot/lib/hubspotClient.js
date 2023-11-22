const hubspot = require('@hubspot/api-client');
const slug = require('slug');
const getHubspotAssociationKey = require('./getHubspotAssociationKey');

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
if (! HUBSPOT_TOKEN) throw new Error('HUBSPOT_TOKEN environement variable missing');

const hubspotClient = new hubspot.Client({ accessToken: HUBSPOT_TOKEN });

const baseUrl = 'https://api.hubapi.com/crm/';

const superagent = require('superagent');

module.exports = {
  hubspotClient,
  hubspotApi: { get, post, createAssociationLabel }
};

async function get(path, query) {
  const res = await superagent.get(baseUrl + path).set({Authorization: 'Bearer ' + HUBSPOT_TOKEN}).query(query);
  return res.body
}

async function post(path, data) {
  const res = await superagent.post(baseUrl + path).set({Authorization: 'Bearer ' + HUBSPOT_TOKEN}).send(data);
  return res.body
}


async function createAssociationLabel(fromObjectType, toObjectType, label) {
  const name = slug(label, '_').toUpperCase();
  const data = {name, label};
  const body = await get(
    `v4/associations/${fromObjectType}/${toObjectType}/labels`,
    data);
  // find best suited assignementLabel if many
  // preffered = requested, 2nd choice = null, then first label
  let assignedLabel = body.results[0].label;
  if (body.results.find((r) => r.label === label)) {
    assignedLabel = label;
  } else if (body.results.find((r) => r.label === null)) {
    assignedLabel = null;
  }
  const associationKey = getHubspotAssociationKey(fromObjectType, toObjectType, assignedLabel);
  console.log('API result: ', body, 'For Data: ', data, {fromObjectType, toObjectType}, 'Association key choosen: ' + associationKey);
  return associationKey;
}