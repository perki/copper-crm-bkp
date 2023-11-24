const { fs, path, SyncStatus, dataSourcePath } = require('./lib/pathsAndFS');
const { pluralMap, mapType } = require('./lib/typeMaps');
const associationDefs = require('../data-hubspot/current/associations.json');
const { getHubspotAssociationKey } = require('./lib/getHubspotAssociationKey');
const { getOwner } = require('./maps/lib-map');

const copperTypes = require('../data/activity_types.json');
const copperTypesMap = {};
for (const ctg of Object.values(copperTypes)) {
  for (const ct of ctg) {
    copperTypesMap[ct.category + ':' + ct.id] = ct;
  }  
}

const result = {
  'notes': [], 
  'calls': [], 
  'meetings': [], 
  'emails': [], 
  'tasks': [], 
  'communications': []
};

const syncMaps = {
  company : new SyncStatus('companies'),
  contact : new SyncStatus('contacts')
}

const activityTrack = {};
const types = {};
const userIdsCount = {};


function generate(copperPluralType, hubspotType) {
  const items = require('../data/'+copperPluralType+'List.json');
  for (const item of items) {
    const activitiesFile = path.resolve(__dirname, '../data/'+copperPluralType+'Activities/'+item.id+'.json');
    if (! fs.existsSync(activitiesFile)) continue;
    const activies = JSON.parse(fs.readFileSync(activitiesFile));
    for (const activity of activies) {
      const aName = activity.type.name || copperTypesMap[activity.type.category + ':' + activity.type.id].name;
      const typeKey = activity.type.category + ':' + activity.type.id + ':' + aName;
      
      // counters
      if (! types[typeKey]) types[typeKey] = 0; 
      types[typeKey]++;
      if (! userIdsCount[activity.user_id]) userIdsCount[activity.user_id] = 0;
      userIdsCount[activity.user_id]++;

      // does a converter exists?
      if (convert[typeKey] == null) continue;

      // only handle company and contact activities
      const toType = mapType[activity.parent.type];
      if (! ['company', 'contact'].includes(toType)) continue;

      if (! activityTrack[activity.id]) {
        const convertedActivity = convert[typeKey](activity);
        convertedActivity.associations = [];
        convertedActivity.copperId = activity.id;

        // set time
        convertedActivity.properties.hs_timestamp = activity.activity_date * 1000;

        // set owner
        if (activity.user_id != null)
          getOwner(activity.user_id, convertedActivity.properties);

        activityTrack[activity.id] = convertedActivity;
        result[convertedActivity.type + 's'].push(convertedActivity);
      } 

      // add association
      const aKey = getHubspotAssociationKey(activityTrack[activity.id].type, hubspotType, null);
      const aDef = associationDefs[aKey];
      if (aDef == null) throw new Error('Cannot find association definition for ' + aKey);

      const hubspotItemId = syncMaps[hubspotType].get(item.id);
      if (! hubspotItemId) throw new Error('Cannot find '+ hubspotType + 'item with id' + item.id)

      activityTrack[activity.id].associations.push({
        to: { id: hubspotItemId },
        types: [{ associationCategory: aDef.category, associationTypeId: aDef.typeId}]
      });
    }

  }
}


function linkedinConversation (item) { 
  return {
    type: 'communication',
    properties: {
      hs_communication_channel_type: 'LINKEDIN_MESSAGE',
      hs_communication_logged_from: 'CRM',
      hs_communication_body: newlineToBr('----- Conversation ---- \n' + item.details)
    }
  }
};
function linkedinConnection (item) {
  return {
    type: 'communication',
    properties: {
      hs_communication_channel_type: 'LINKEDIN_MESSAGE',
      hs_communication_logged_from: 'CRM',
      hs_communication_body:  newlineToBr('----- Connection ---- \n' + item.details)
    }
  }
};
function linkedinMessage (item) {
  return {
    type: 'communication',
    properties: {
      hs_communication_channel_type: 'LINKEDIN_MESSAGE',
      hs_communication_logged_from: 'CRM',
      hs_communication_body:  newlineToBr('----- Message ---- \n' + item.details)
    }
  }
};
function textMessage (item) {
  return {
  type: 'communication',
  properties: {
    hs_communication_channel_type: 'SMS',
    hs_communication_logged_from: 'CRM',
    hs_communication_body:  newlineToBr('----- Message ---- \n' + item.details)
  }
}};
function statusChange (item) {
  return {
    type: 'note',
    properties: {
      hs_note_body : 'Status-Change : '+ item.old_value + ' => ' + item.new_value
    }
  }
};
function note (item) {
  return {
    type: 'note',
    properties: {
      hs_note_body : '----- Note ---- \n' + newlineToBr(item.details)
    }
  }
};
function meeting (item) {
  return {
    type: 'meeting',
    properties: {
      hs_meeting_body: newlineToBr(item.details)
    }
  }
};

function phoneCall (item) {
  return {
    type: 'call',
    properties: {
      hs_call_body: newlineToBr(item.details)
    }
  }
};
function confCall (item) {
  return {
    type: 'call',
    properties: {
      hs_call_body: newlineToBr(item.details)
    }
  }
};

function email (item) {
  return {
    type: 'email',
    properties: {
      hs_email_direction: 'EMAIL',
      hs_email_text: newlineToBr(item.details)
    }
  }
};

function todo (item) {
  return {
    type: 'note',
    properties: {
      hs_note_body: 'TODO: ' + newlineToBr(item.details)
    }
  }
};

function newlineToBr(text) {
  if (text == null) return;
  return text.replaceAll('\n','\n<BR>');
}

const convert = {
  'system:1:Contact Type Change': null,
  'user:1127438:LinkedIn Conversation': linkedinConversation,
  'system:2:Assignee Change': null,
  'user:852701:LinkedIn Connection': linkedinConnection,
  'system:1:Status Change': statusChange,
  'user:0:Note': note,
  'user:837860:Meeting': meeting,
  'user:852702:LinkedIn Message': linkedinMessage,
  'user:837859:Phone Call': phoneCall,
  'user:857607:Conf Call': confCall,
  'user:837861:To Do': todo,
  'user:858047:Text Message': textMessage,
  'user:837898:Email': email,
  'user:837897:Lunch': meeting,
  'system:1:Name Change': null,
  'system:1:Value Change': null,
  'system:3:Stage Change': null,
  'system:1:Pipeline Change': null
}


generate('people', 'contact');

console.log(Object.keys(activityTrack).length);
generate('leads', 'contact');

console.log(Object.keys(activityTrack).length);
generate('companies', 'company');
console.log(Object.keys(activityTrack).length);

console.log('userIds', userIdsCount);

fs.writeFileSync(path.resolve(dataSourcePath, 'activities.json'), JSON.stringify(result, null, 2));
