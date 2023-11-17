
module.exports = {
  getSocialsFor,
  getPhonesFor,
  getWebsites,
  getOwner
}

const ownersArray = require('../../data-hubspot/conf/ownersMap.json');
const ownersByCopperIdMap = {};
for (const owner of ownersArray) {
  if (owner.copper == null) throw new Error('Missing copper Id for owner ' + JSON.stringify(owner) + ' in data-hubspot/conf/ownersMap.json');
  ownersByCopperIdMap[owner.copper + ''] = owner;
}



function getSocialsFor(type = 'contact') {
  const isCompany = (type === 'company');
  return function getSocials(socials, hubspotItem) {
    for (const social of socials) {
      if (social.category === 'twitter' && hubspotItem.twitterhandle == null) {
        hubspotItem.twitterhandle = social.url.split('/').pop();
        continue;
      } 
      
      if (social.category === 'linkedin') {
        if (isCompany && hubspotItem.linkedin_company_page == null) {
          hubspotItem.linkedin_company_page = social.url;
          continue;
        } 
        
        if (! isCompany && hubspotItem.hs_linkedinid == null) {
          const s = social.url.split('/');
          do {
            hubspotItem.hs_linkedinid = s.pop();
          } while (s.length > 0 && hubspotItem.hs_linkedinid === '');
          continue;
        } 
      } 

      if (hubspotItem.extras.socials == null) hubspotItem.extras.socials = [];
      hubspotItem.extras.socials.push(social.category + ': ' + social.url);
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
function getPhonesFor(type = 'contact') {
  const isCompany = (type === 'company');
  return function getPhones(phones, hubspotItem) {
    for (const phone of phones) {
      if (!isCompany && phone.category === 'mobile' && hubspotItem.mobilephone == null) {
        hubspotItem.mobilephone = phone.number;
      } else if (phone.category === 'work' && hubspotItem.phone == null) {
        hubspotItem.phone = phone.number;
      } else {
        if (hubspotItem.extras.phones == null) hubspotItem.extras.phones = [];
        hubspotItem.extras.phones.push(phone.category + ': ' + phone.number);
      }
    }
  }
}

function getOwner(copperId, hubspotItem) {
  if (copperId == null) return null;
  const owner = ownersByCopperIdMap[copperId + ''];
  if (owner == null) throw new Error('Cannot find owner with copperId: ' + copperId);
  const hubspotId = owner.hubspot?.userId;
  if (hubspotId == null) throw new Error('Cannot find hubspot.userId for copperId: ' + copperId);
  hubspotItem.hubspot_owner_id = hubspotId;
}