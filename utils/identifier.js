module.exports = function (usedIdentifiers) {
  const identifierLimit = 9999;
  
  if (usedIdentifiers.length == identifierLimit)
    throw new Exception('No more identifiers available');

  let allowedIdentifiers = [...Array(identifierLimit).keys()];

  for (let identifier of usedIdentifiers)
  // remove used identifiers
  allowedIdentifiers.splice(allowedIdentifiers.indexOf(identifier), 1);
  
  // cast to string
  let identifier = Math.floor(Math.random() * allowedIdentifiers.length) + "";

  identifier = identifier.padStart(4, 0);
  return identifier;
}
