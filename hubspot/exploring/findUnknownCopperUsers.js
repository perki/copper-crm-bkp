const knownCopperUsers = require('../../data/usersList.json');
const ownersArray = require('../../data-hubspot/conf/ownersMap.json');
const ownersByCopperIdMap = {};
for (const owner of ownersArray) {
  if (owner.copper == null) throw new Error('Missing copper Id for owner ' + JSON.stringify(owner) + ' in data-hubspot/conf/ownersMap.json');
  ownersByCopperIdMap[owner.copper + ''] = owner;
}