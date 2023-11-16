const hubspot = require('@hubspot/api-client');
global.SKIP_AUTO_GET_PROPERTIES = true; // prevent getProperties to run automatically
const getCurrentProperties = require('./getProperties');

const { pluralMap } = require('./lib/typeMaps');

const customDefs = require('../data-hubspot/conf/custom_def.json');
const fieldDefs = require('../data-hubspot/conf/fields_def.json');

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
    }, {
      groupName: type + 'information',
      name: 'tags',
      label: 'Tags',
      hasUniqueValue: false,
      type: 'string',
      fieldType: 'text'
    }
    ],
    update: []
  };



  // check properties from custom_def
  checkExistingPropsVsDefinition(customDefs, type, currentProps, todo);
  // check properties from custom_def
  checkExistingPropsVsDefinition(fieldDefs, type, currentProps, todo);

  return todo;
}


(async () => {
  for (const type of Object.keys(pluralMap)) {
    console.log('**** ' + type);

    const propsCurrent = await getCurrentProperties(pluralMap[type]);
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
      await getCurrentProperties(pluralMap[type], true);
    }
  }
})();


function checkExistingPropsVsDefinition(definitions, type, currentProps, todo) {
  const typeDefs = definitions[type];
  if (!typeDefs) return;

  for (const k of Object.keys(typeDefs)) {
    const def = typeDefs[k];
    if (def.dest.startsWith('extra')) continue;

    const matchingProp = currentProps.find((p) => p.name === def.dest);

    if (matchingProp) { // Found;
      let action = null;
      // check if OK
      if (def.handle === 'MapItemSELECT') {
        def.fieldType = def.fieldType || 'select';
        if (matchingProp.type !== 'enumeration' || matchingProp.fieldType !== def.fieldType) {
          console.log('>>' + type + ' Wrong type for def', def, 'Required: ' + matchingProp.fieldType);
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
          if (!matchedOption) {
            console.log('>>' + type + '>' + def.name + ' missing option: ' + oVal.value);
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
        groupName: def.groupName || type + 'information',
        propertyUpdate: 'options',
        hasUniqueValue: false,
        type: 'enumeration',
        fieldType: def.fieldType || 'select',
        options: Object.values(def.conf)
      }
      todo.create.push(propObj);
    }
  }
}