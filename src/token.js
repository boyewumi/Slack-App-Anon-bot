const tokenCacheFile = __dirname + '/tokenCache.json';

let tokenCache = null;
let userCache = null;
const fsp = require('fs').promises;
const fs = require('fs');

setTokensFromCache = async () => {
  //Ensure token cache file exists before reading
  try {
    await fsp.access(tokenCacheFile, fs.constants.F_OK);
    const data = await fsp.readFile(tokenCacheFile, 'utf8');
    [tokenCache, userCache] = JSON.parse(data);
  } catch (error) {
    console.log(`Error reading file ${tokenCacheFile}`);
    tokenCache = {};
    userCache = {};
  }
};

module.exports.getTokens = async () => {
  /* istanbul ignore next  */
  if (tokenCache === null || userCache === null) {
    await setTokensFromCache();
  }

  return { tokenCache, userCache };
};

module.exports.setTokens = async (team_id, bot_access_token, oauth_access_token, bot_user_id) => {
  /* istanbul ignore next  */
  if (tokenCache === null || userCache === null) {
    await setTokensFromCache();
  }

  // Store token by team in bot state.
  tokenCache[team_id] = {
    bot_access: bot_access_token,
    oauth_access: oauth_access_token,
  };

  // Capture team to bot id
  userCache[team_id] = bot_user_id;

  //Store token cache for persistence between server loads
  fs.writeFileSync(tokenCacheFile, JSON.stringify([tokenCache, userCache]));
};
