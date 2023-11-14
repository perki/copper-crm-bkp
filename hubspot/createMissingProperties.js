const hubspot = require('@hubspot/api-client');
global.SKIP_AUTO_GET_PROPERTIES = true; // prevent getProperties to run automatically
const getCurrentProperties = require('./getProperties');


const customDefs = require('../data-hubspot/conf/custom_def.json');

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
if (!HUBSPOT_TOKEN) throw new Error('HUBSPOT_TOKEN environement variable missing');

const hubspotClient = new hubspot.Client({ accessToken: HUBSPOT_TOKEN });

async function createProp(type, propertyObj) {
  try {
    const response = await hubspotClient.crm.properties.coreApi.create(type, propertyObj);
    // console.log(response);
    console.log(type + ' created ✅' + propertyObj.name);
  } catch (e) {
    if (e.body?.category === 'OBJECT_ALREADY_EXISTS') {
      console.log(type + ' found ❓' + propertyObj.name);
    } else {
      console.log(e.body || e);
    }
  }
};

async function updateProp(type, udpateObjSource) {
  const updateObj = structuredClone(udpateObjSource);
  const name = updateObj.name;
  delete updateObj.name;
  try {
    const response = await hubspotClient.crm.properties.coreApi.update(type, name, updateObj);
    // console.log(response);
    console.log(type + ' updated ✅' + name);
  } catch (e) {
    console.log(e.body || e);
  }
};

const typesMap = {
  'company': 'companies',
  'deal': 'deals',
  'contact': 'contacts',
  'task': 'tasks'
};

function getProperties(type, currentProps) {
  const todo = {
    create: [{
      groupName: type + 'information',
      name: 'copperid',
      label: 'CopperId',
      hasUniqueValue: true,
      type: 'string',
      fieldType: 'text'
    }, {
      groupName: type + 'information',
      name: 'description',
      label: 'Description',
      hasUniqueValue: false,
      type: 'string',
      fieldType: 'textarea'
    }
    ],
    update: []
  };
  
  // check properties from custom_def
  checkExistingProps(type, currentProps, todo);

  return todo;
}


(async () => {
  
  for (const type of Object.keys(typesMap)) {
    console.log('**** ' + type);

    const propsCurrent = await getCurrentProperties(typesMap[type]);
    const propRequired = getProperties(type, propsCurrent);
    let createdOne = false;
    for (const prop of propRequired.create) {
      if (propsCurrent.find((i) => i.name == prop.name)) {
        // check if property match 
        console.log(type + ' skip ⏭️ ' + prop.name);
      } else {
        await createProp(type, prop);
        createdOne = true;
      }
    }
    let updatedOne = false;
    for (const prop of propRequired.update) {
      await updateProp(type, prop);
      createdOne = true;
    }


    if (createdOne || updatedOne) {
      await getCurrentProperties(typesMap[type], true);
    }
  }
 })();



 function checkExistingProps(type, currentProps, todo) {
  const typeCustomDefs = customDefs[type];
  if (typeCustomDefs) {
    for (const k of Object.keys(typeCustomDefs)) {
      const def = typeCustomDefs[k];
      if (def.dest.startsWith('extra')) continue;
           
      const matchingProp = currentProps.find((p) => p.name === def.dest);

      if (matchingProp) { // Found;
        let action = null;
        // check if OK
        if (def.handle === 'MapItemSELECT') {
          if (matchingProp.type !== 'enumeration' || matchingProp.fieldType !== 'select' ) {
            console.log('>>' + type + ' Wrong type for def', def);
            throw new Error('Cannot update');
          }
          // hide all existing option
          const options = structuredClone(matchingProp.options).map((o) => { 
            o.hidden = true;
            return o;
          });
          
          for (const oKey of Object.keys(def.conf)) {
            const oVal = def.conf[oKey];
            const matchedOption = matchingProp.options.find((o) => o.value === oVal.value);
            if (! matchedOption) {
              console.log('>>' +type + '>' + def.name + ' missing option: ' + oVal.value);
              options.push(oVal);
              action = 'update';
            } else {
              matchedOption.hidden = false;
            }
          }
          if (action != null) {
            const propObj = {
              name: def.dest,
              options: options
            };
            todo.update.push(propObj);
          }
        }
      } else {
        const propObj = {
          name: def.dest,
          label: def.name,
          propertyUpdate: 'options',
          hasUniqueValue: false,
          type: 'enumeration',
          fieldType: 'select',
          options: Object.values(def.conf)
        }
        todo.create.push(propObj);
      }
      
    }
  }
 }