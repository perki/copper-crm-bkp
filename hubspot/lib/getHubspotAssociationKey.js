const slug = require('slug');

function getHubspotAssociationKey(fromType, toType, label) {
  const slugLabel = label ? slug(label,'_').toUpperCase() : 'GENERIC';
  return fromType + '-' + toType + '-' + slugLabel;
}

function getHubspotAssociationKeyFor(a) {
  return getHubspotAssociationKey(a.fromType, a.toType, a.label);
}

module.exports = {
  getHubspotAssociationKey,
  getHubspotAssociationKeyFor
}