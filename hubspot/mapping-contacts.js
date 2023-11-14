const { fs, path, dataCurrentPath, dataConfPath, dataSourcePath } = require('./lib/pathsAndFS');

const handleCustomFields = require('./lib/handleCustomFields');

const customerSourceIdsMap = {};
for (const cs of require('../data/customer_sources.json')) {
  customerSourceIdsMap[cs.id + ''] = cs.name;
}

const umatchedFields = {};

function convertPeople(p) {
  const person = structuredClone(p);
  const contact = {
    salutation: person.prefix,
    firstname: person.first_name,
    lastname: person.last_name,
    jobtitle: person.title,
    address: person.address?.street,
    city: person.address?.city,
    state: person.address?.state,
    zip: person.address?.zip,
    country: person.address?.country,
    company: person.company_name,
  }
  for (const f of ['prefix', 'first_name', 'last_name', 'title', 'address', 'company_name']) delete person[f];

  // ignored fields
  for (const f of ['suffix', 'leads_converted_from', 'converted_unit', 'monetary_unit', 'monetary_value', 'converted_value', 'middle_name']) delete person[f];


  // owner
  contact.hubspot_owner_id = getOwner(person.assignee_id);
  delete person.assignee_id;

  // associated companyId
  contact.associatedcompanyid = getCompanyId(person.company_id);
  delete person.company_id;

  // emails
  const extras = { emails: [],  websites: [],  socials: [], phones: [], others: []};
  if (person.email) {
    contact.work_email = person.email;
    delete person.email;
  }
  if (person.emails) {
    for (const email of person.emails) {
      if (email.category === 'work' && contact.work_email == null) {
        contact.work_email = email.email;
      } else if (email.category === 'home' && contact.email == null) {
        contact.email = email.email;
      } else {
        extras.emails.push(email.category + ': ' + email.email);
      }
    }
    delete person.emails;
  }

  // websites
  if (person.websites) {
    for (const item of person.websites) {
      if (item.url.startsWith('https://podio')) continue;
      if (contact.website == null) {
        contact.website = item.url;
      } else {
        extras.websites.push(item.category + ': ' + item.url);
      }
    }
    delete person.websites;
  }

  // socials
  if (person.socials) {
    for (const social of person.socials) {
      if (social.category === 'twitter' && contact.twitterhandle == null) {
        contact.twitterhandle = social.url.split('/').pop();
      } else if (social.category === 'linkedin' && contact.hs_linkedinid == null) {
        const s = social.url.split('/');
        do {
          contact.hs_linkedinid = s.pop();
        } while (s.length > 0 && contact.hs_linkedinid === '');
      } else {
        extras.socials.push(social.category + ': ' + social.url);
      }
    }
    delete person.socials;
  }

  // phone
  if (person.phone_numbers) {
    extras.phones = [];
    for (const phone of person.phone_numbers) {
      if (phone.category === 'mobile' && contact.mobilephone == null) {
        contact.mobilephone = phone.number;
      } else if (phone.category === 'work' && contact.phone == null) {
        contact.phone = phone.number;
      } else {
        extras.phones.push(phone.category + ': ' + phone.number);
      }
    }
    delete person.phone_numbers;
  }

  // others
  for (const d of ['date_created', 'date_modified', 'date_lead_created', 'date_last_contacted']) {
    if (person[d] != null) extras.others.push(d + ': ' + Date(person[d]).toString());
    delete person[d];
  }
  for (const f of ['name', 'interaction_count']) {
    if (person[f] != null) extras.others.push(f + ': ' + person[f]);
    delete person[f];
  }

  // customer source
  if (person.customer_source_id) {
    extras.others.push('customer_source: ' + customerSourceIdsMap[person.customer_source_id]);
    delete person.customer_source_id;
  }

  // name
  // middle_name
  // suffix
  // contact_type_id 
  // tags 0,1

  if (person.custom_fields) {
    contact.extras = extras;
    handleCustomFields('contact', person.custom_fields, contact);
    delete person.custom_fields;
    delete contact.extras;
  }

  // cleanup empty fields
  for (const k of Object.keys(contact)) {
    const v = contact[k];
    if (v == null || (Array.isArray(v) && v.length === 0)) {
      delete contact[k];
    }
  }

  const notes = [];
  for (const key of Object.keys(extras)) {
    const entries = extras[key];
    if (entries.length === 0) continue;
    notes.push('**** ' + key + ' ****\n' + entries.join('\n'));
  }


  contact.note = '>>> AT IMPORT FROM COPPER ' + Date().toString() + ' <<<\n\n';
  
  if (person.details) contact.note += p.details + '\n\n';
  delete person.details;

  if (notes.length > 0) {
    contact.note += notes.join('\n\n');
  }

  console.log(contact.note);

  // count unmatched fields
  for (const k of Object.keys(person)) {
    if (umatchedFields[k] == null) umatchedFields[k] = 0;
    umatchedFields[k]++;
  }

  return contact;
};

const ownersArray = require('../data-hubspot/conf/ownersMap.json');
const ownersByCopperIdMap = {};
for (const owner of ownersArray) {
  if (owner.copper == null) throw new Error('Missing copper Id for owner ' + JSON.stringify(owner) + ' in data-hubspot/conf/ownersMap.json');
  ownersByCopperIdMap[owner.copper + ''] = owner;
}

function getOwner(copperId) {
  if (copperId == null) return null;
  const owner = ownersByCopperIdMap[copperId + ''];
  if (owner == null) throw new Error('Cannot find owner with copperId: ' + copperId);
  const hubspotId = owner.hubspot?.userId;
  if (hubspotId == null) throw new Error('Cannot find hubspot.userId for copperId: ' + copperId);
  return hubspotId;
}

function getCompanyId(copperId) {
  return 'TODO for ' + copperId;
}


const people = require('../data/peopleList.json');
const contacts = people.map(convertPeople);

const leads = require('../data/leadsList.json');
contacts.push(...leads.map(convertPeople));


const hubDest = path.resolve(dataSourcePath, 'contacts.json');
fs.writeFileSync(hubDest, JSON.stringify(contacts, null, 2));

console.log({umatchedFields});