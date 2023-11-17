const properties = require('../../data-hubspot/properties/contacts.json');


for (const p of properties) {
  console.log(p.name + '\t' + p.description);
}

