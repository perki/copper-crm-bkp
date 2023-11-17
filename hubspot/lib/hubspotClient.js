const hubspot = require('@hubspot/api-client');

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
if (! HUBSPOT_TOKEN) throw new Error('HUBSPOT_TOKEN environement variable missing');

const hubspotClient = new hubspot.Client({ accessToken: HUBSPOT_TOKEN });

module.exports = hubspotClient;