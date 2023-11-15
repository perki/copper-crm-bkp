
const { getSocialsFor, getPhonesFor, getWebsites, getOwner } = require('./lib-map');

module.exports = {
  directs: {
    'address.street': 'street',
    'address.city': 'city',
    'address.state': 'state',
    'address.postal_code': 'zip',
    'address.country': 'country',
    'name': 'name',
    'email_domain': 'domain'
  },
  ignores: [
    
  ],
  methods: {
    'assignee_id': getOwner,
    'socials': getSocialsFor('company'),
    'websites': getWebsites,
    'phone_numbers': getPhonesFor('company')
  },
  others: {
    'date_created': 'date', 
    'date_modified': 'date', 
    'date_lead_created': 'date', 
    'date_last_contacted': 'date',
    'name': 'direct', 
    'interaction_count': 'direct'
  }
}

const ownersArray = require('../../data-hubspot/conf/ownersMap.json');
const ownersByCopperIdMap = {};
for (const owner of ownersArray) {
  if (owner.copper == null) throw new Error('Missing copper Id for owner ' + JSON.stringify(owner) + ' in data-hubspot/conf/ownersMap.json');
  ownersByCopperIdMap[owner.copper + ''] = owner;
}



function getEmail(email, hubspotItem) {
  getEmails([email], hubspotItem);
}

function getEmails(emails, hubspotItem) {
  for (const emailItem of emails) {
    if (emailItem.category === 'work' && hubspotItem.work_email == null) {
      hubspotItem.work_email = emailItem.email;
    } else if (emailItem.category === 'home' && hubspotItem.email == null) {
      hubspotItem.email = emailItem.email;
    } else {
      if (hubspotItem.extras.emails == null) hubspotItem.extras.emails = [];
      hubspotItem.extras.emails.push(emailItem.category + ': ' + emailItem.email);
    }
  }
}







function getCompanyId(copperCompanyId, hubspotItem) {
  // TODO
}

