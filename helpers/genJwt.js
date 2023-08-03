const jsonwebtoken = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const rsaPrivatePathToKey = path.join(__dirname, '..', 'access_rsa_private.pem');
const rsaPublicPathToKey = path.join(__dirname, '..', 'access_rsa_public.pem');
const PRIV_KEY = fs.readFileSync(rsaPrivatePathToKey, 'utf8');
const PUB_KEY = fs.readFileSync(rsaPublicPathToKey, 'utf8');


/**
 * @param {*} user - The user object.  We need this to set the JWT `sub` payload property to the MongoDB user ID
 */
module.exports.signJWT = (payload, expiresIn = '1d') => {

  const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { expiresIn: expiresIn, algorithm: 'RS256' });

  return {
    token: "Bearer " + signedToken,
  }
}

module.exports.verifyJwt = (token) => {
  return jsonwebtoken.verify(token, PUB_KEY)
}