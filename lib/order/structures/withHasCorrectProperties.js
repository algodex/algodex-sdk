function hasCorrectProperties(obj, ...propertyNames) {
  const keysArr= Object.keys(obj);
  let hasProp = true;
  for (const prop of propertyNames) {
    if (!keysArr.includes(prop)) hasProp=false;
  }
  return hasProp;
}


module.exports = hasCorrectProperties;
