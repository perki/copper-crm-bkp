module.exports = {
  directs: {
    prefix: 'salutation',
    first_name: 'firstname',
    last_name: 'lastname',
    title: 'jobtitle',
    'address.street': 'street',
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
    'socials': getSocials,
    'phone_numbers': getPhones
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

function getOwner(copperId, hubspotItem) {
  if (copperId == null) return null;
  const owner = ownersByCopperIdMap[copperId + ''];
  if (owner == null) throw new Error('Cannot find owner with copperId: ' + copperId);
  const hubspotId = owner.hubspot?.userId;
  if (hubspotId == null) throw new Error('Cannot find hubspot.userId for copperId: ' + copperId);
  hubspotItem.hubspot_owner_id = hubspotId;
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

function getWebsites(websites, hubspotItem) {
  for (const item of websites) {
    if (item.url.startsWith('https://podio')) continue;
    if (hubspotItem.website == null) {
      hubspotItem.website = item.url;
    } else {
      if (hubspotItem.extras.websites == null) hubspotItem.extras.websites = [];
      hubspotItem.extras.websites.push(item.category + ': ' + item.url);
    }
  }
}

function getSocials(socials, hubspotItem) {
  for (const social of socials) {
    if (social.category === 'twitter' && hubspotItem.twitterhandle == null) {
      hubspotItem.twitterhandle = social.url.split('/').pop();
    } else if (social.category === 'linkedin' && hubspotItem.hs_linkedinid == null) {
      const s = social.url.split('/');
      do {
        hubspotItem.hs_linkedinid = s.pop();
      } while (s.length > 0 && hubspotItem.hs_linkedinid === '');
    } else {
      if (hubspotItem.extras.socials == null) hubspotItem.extras.socials = [];
      hubspotItem.extras.socials.push(social.category + ': ' + social.url);
    }
  }
}

function getPhones(phones, hubspotItem) {
  for (const phone of phones) {
    if (phone.category === 'mobile' && hubspotItem.mobilephone == null) {
      hubspotItem.mobilephone = phone.number;
    } else if (phone.category === 'work' && hubspotItem.phone == null) {
      hubspotItem.phone = phone.number;
    } else {
      if (hubspotItem.extras.phones == null) hubspotItem.extras.phones = [];
      hubspotItem.extras.phones.push(phone.category + ': ' + phone.number);
    }
  }
}

function getCompanyId(copperCompanyId, hubspotItem) {
  // TODO
}

