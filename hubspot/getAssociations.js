const { hubspotClient, hubspotApi } = require('./lib/hubspotClient');
const { fs, path, dataCurrentPath } = require('./lib/pathsAndFS');
const { pluralMap } = require('./lib/typeMaps');
const { getHubspotAssociationKey, getHubspotAssociationKeyFor } = require('./lib/getHubspotAssociationKey');

async function getAssociations(forceFecth) {
  const filePath = path.resolve(dataCurrentPath, 'associations.json');
  if (fs.existsSync(filePath) && ! forceFecth) {
    return require(filePath);
  }
  
  const associations = {};
  for (const fromType of Object.keys(pluralMap)) {
    for (const toType of Object.keys(pluralMap)) {
      const body = await hubspotApi.get('v4/associations/' + fromType + '/' + toType + '/labels');
      await new Promise((r) => { setTimeout(r, 200) });
      for (const item of body.results) {
        const entry = {
          fromType,
          toType,
          label: item.label,
          category: item.category,
          typeId: item.typeId,
        }
        const hubspotAssociationKey = getHubspotAssociationKeyFor(entry);
        associations[hubspotAssociationKey] = entry;
      }
    }
  };
  generateReverse(associations);
  fs.writeFileSync(filePath, JSON.stringify(associations, null, 2));
  return associations;
}

function generateReverse(associations) {
  for (const [associationKey, association] of Object.entries(associations)) {
    if (association.reverse != null) {
      continue;
    }
    const candidates = [];
    for (const [aKey, a] of Object.entries(associations)) { 
      if (aKey != associationKey && 
        a.toType === association.fromType && 
        a.fromType === association.toType && 
        association.reverse == null) {
        candidates.push(a);
      }
    };
    function setReverse(candidate) {
      association.reverse = getHubspotAssociationKeyFor(candidate);
      candidate.reverse = associationKey;
    }

    if (candidates.length === 1) {
      setReverse(candidates[0]);
      continue;
    }
    const correspondingKeyCandidates = candidates.filter((a) => getHubspotAssociationKey(a.toType, a.fromType, a.label) == associationKey);
    if (correspondingKeyCandidates.length > 1) throw new Error('Found more than one canidate with same label ' + JSON.stringify(association)+ ' Candidates ' + JSON.stringify(sameLabelCandidates));
    if (correspondingKeyCandidates.length === 1) {
      setReverse(correspondingKeyCandidates[0]);
      continue;
    }
    if (association.label != null && association.label.toLowerCase().includes('primary')) {
      const nullLabelCandidates = candidates.filter((a) => a.label != null && a.label.toLowerCase().includes('primary'));
      if (nullLabelCandidates.length === 1) {
        setReverse(nullLabelCandidates[0]);
        continue;
      }
    }
  }


  for (const [associationKey, association] of Object.entries(associations)) {
    if (getHubspotAssociationKeyFor(association) != associationKey) {
      console.log('Wrong key for', association, 'got: ' + associationKey + ' expected :' + getHubspotAssociationKeyFor(association));
      continue;
    }

    if (association.reverse == null) {
      console.log('Missing association for', associationKey, association);
      continue;
    }
    if (associations[association.reverse] == null) {
      console.log('Non existent reverse for', association);
      continue;
    }
    const reverseAssociation = associations[association.reverse];
    const reverseKey = getHubspotAssociationKeyFor(reverseAssociation);
    if (reverseAssociation.reverse != associationKey) {
      console.log('Wrong reverse For ',associationKey, association, ' ===> ',reverseKey, reverseAssociation);
    }
  }
}

module.exports =  {
  getAssociations
};

if (!global.SKIP_AUTO_GET_ASSOCIATIONS) {
  (async () => {
    await getAssociations(true);
  })();
}
