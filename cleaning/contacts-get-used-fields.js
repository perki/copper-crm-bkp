/**
 * read data/peopleList and extract all fields used with non-null values
 */
const contacts = require('../data/peopleList.json');

const used = {};

for (const person of contacts) {
  inspect(person);
  
}
console.log(used);

function inspect(obj, path = []) {
  for (const key of Object.keys(obj)) {
    const me = obj[key];
    if (me == null) continue;
    const myPath = [...path];
    myPath.push(key);
    const mykey = myPath.join('/');
    if (used[mykey] == null) used[mykey] = 0;
    used[mykey]++;
    if (me instanceof Object) inspect(me, myPath);
  } 
}