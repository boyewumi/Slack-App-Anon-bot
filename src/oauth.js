const token = require('./token');

module.exports.GetOAuthToken = async teamId => {
  const { tokenCache, _ } = await token.getTokens();
  if (tokenCache[teamId]) {
    return tokenCache[teamId].oauth_access;
  } else {
    console.error(`Team not found in tokenCache: ${teamId}`);
  }
};
