
const { getSocialsFor, getPhonesFor, getWebsites, getOwner } = require('./lib-map');

module.exports = {
  directs: {
    'address.street': 'address',
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
