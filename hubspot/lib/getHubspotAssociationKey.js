const slug = require('slug');
module.exports = function getHubspotAssociationKey(fromType, toType, label) {
  const slugLabel = label ? slug(label,'_').toUpperCase() : 'GENERIC';
  return fromType + '-' + toType + '-' + slugLabel;
}