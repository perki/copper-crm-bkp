
const { getSocialsFor, getPhonesFor, getWebsites, getOwner } = require('./lib-map');

module.exports = {
  directs: {
    prefix: 'salutation',
    first_name: 'firstname',
    last_name: 'lastname',
    title: 'jobtitle',
    'address.street': 'address',
    'address.city': 'city',
    'address.state': 'state',
    'address.postal_code': 'zip',
    'address.country': 'country',
    'company_name': 'company'
  },
  ignores: [
    'status', // managed by status_id 
    'suffix', 'leads_converted_from', 'converted_unit', 'monetary_unit', 'monetary_value', 'converted_value', 'middle_name'
  ],
  methods: {
    'email': getEmail,
    'emails': getEmails,
    'assignee_id': getOwner,
    'company_id': getCompanyId,
    'websites': getWebsites,
    'socials': getSocialsFor('contact'),
    'phone_numbers': getPhonesFor('contact')
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
  hubspotItem._transitional.copperCompanyId = copperCompanyId;
  // TODO
}

