const {fs, path, dataCurrentPath, dataConfPath, dataSourcePath} = require('./lib/pathsAndFS');


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
  }



  // owner
  contact.hubspot_owner_id = getOwner(person.assignee_id);

  // associated companyId
  // contact.associatedcompanyid

  const extras = {emails: []};
  // emails
  for (const email of person.emails) {
    if (email.category === 'work' && contact.work_email == null) {
      contact.work_email = email.email;
    } else if (email.category === 'home' && contact.email == null) {
      contact.email = email.email;
     } else {
      extras.emails.push(email.category + ': ' + email.email);
    }
  }

  // websites
  extras.websites = [];
  for (const item of person.websites) {
    if (item.url.startsWith('https://podio')) continue;
    if (contact.website == null) {
      contact.website = item.url;
    } else {
      extras.websites.push(item.category + ': ' + item.url);
    }
  }

  // socials
  extras.socials = [];
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

  // phone
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

  // name
  // middle_name
  // suffix
  // assignee_id
  // company_id 
  // company_name
  // contact_type_id 
  // tags 0,1
  // custom fields 
    // ...... 
  // date_created
  // date_modified
  // lead_converted_from
  // details 
  // custom 345947 => createdBy (string)
  // custom 345948 => createdOn (date)
  // custom 353217 => Also active in company (Connect)
  // custom 353223 => Was active in company (Connect)
  // custom 354201 => Involved in opportunities (Connect)
  // custom 427797 => Follow up Ranks( )
  // custom 523707 => relashinship (string)
  // custom 523708 => O2B Campaign
  // custom 523709 => Industry Target
  // custom 523710 => Call- done (string)
  // custom 523711 => When spoke to? (string)
  // custom 523712 => Next Steps (string)

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
  if (notes.length > 0) 
    contact.note = notes.join('\n\n');

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

const people = require('../data/peopleList.json');

const contacts = people.map(convertPeople);

const hubDest = path.resolve(dataSourcePath, 'contacts.json');
fs.writeFileSync(hubDest, JSON.stringify(contacts, null, 2));
