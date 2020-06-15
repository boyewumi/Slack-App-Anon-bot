// This is the main file for the anon-ask bot.

// Import Botkit's core features
const { WebClient } = require('@slack/web-api');

const fs = require('fs');
const { Botkit } = require('botkit');
const { BotkitCMSHelper } = require('botkit-plugin-cms');
const path = require('path');

// Import a platform-specific adapter for slack.

const {
  SlackAdapter,
  SlackMessageTypeMiddleware,
  SlackEventMiddleware,
} = require('botbuilder-adapter-slack');

const { MongoDbStorage } = require('botbuilder-storage-mongodb');
const mongodb = require('mongoose');
let User = require('./schema/user');

const { getTokens, setTokens } = require('./token');

// Load process.env values from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

let storage = null;
if (process.env.MONGO_URI_BOT) {
  storage = mongoStorage = new MongoDbStorage({
    url: process.env.MONGO_URI_BOT,
  });
}

mongodb.Promise = global.Promise;
let stateDb;
mongodb
  .connect(process.env.MONGO_URI_STATE, { useNewUrlParser: true })

  .then(() => {
    console.log('Successfully connected to the database');
    stateDb = mongodb.connection;
  })
  .catch(err => {
    console.log('Could not connect to the database. Exiting now...' + err);
    process.exit();
  });
const adapter = new SlackAdapter({
  debug: true,
  // parameters used to secure webhook endpoint
  clientSigningSecret: process.env.clientSigningSecret,

  // credentials used to set up oauth for multi-team apps
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  scopes: [
    'bot',
    'channels:history',
    'groups:history',
    'chat:write:bot',
    'mpim:history',
    'im:history',
  ],
  redirectUri: process.env.redirectUri,

  // functions required for retrieving team-specific info
  // for use in multi-team apps
  getTokenForTeam: getTokenForTeam,
  getBotUserByTeam: getBotUserByTeam,
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());

const controller = new Botkit({
  webhook_uri: '/api/messages',

  adapter: adapter,

  storage,
});

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {
  // load traditional developer-created local custom feature modules
  controller.loadModules(__dirname + '/features');
});

controller.webserver.get('/', (req, res) => {
  res.send(`This app is running Botkit ${controller.version}.`);
});

controller.webserver.get('/install', (req, res) => {
  // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
  res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get('/install/auth', async (req, res) => {
  try {
    const results = await controller.adapter.validateOauthCode(req.query.code);

    await setTokens(
      results.team_id,
      results.bot.bot_access_token,
      results.access_token,
      results.bot.bot_user_id
    );

    //Ping the Slack API to get a list of users in the workspace
    let api = new WebClient(results.bot.bot_access_token);
    let userResponse = await api.users.list({});

    let users = userResponse.members.map(member => {
      return {
        workspace_id: member.team_id,
        user_id: member.id,
        is_admin: member.is_admin,
      };
    });

    let options = { upsert: true, new: true };
    for (let user of users) {
      let isAdmin = user.is_admin;
      delete user.is_admin;
      User.findOneAndUpdate(user, { is_banned: false, is_admin: isAdmin }, options, function(err) {
        if (err) throw err;
      });
    }

    res.json('Success! Bot installed.');
  } catch (err) {
    console.error('OAUTH ERROR:', err);
    res.status(401);
    res.send(err.message);
  }
});

async function getTokenForTeam(teamId) {
  const { tokenCache, _ } = await getTokens();
  if (tokenCache[teamId]) {
    return new Promise(resolve => {
      setTimeout(function() {
        resolve(tokenCache[teamId].bot_access);
      }, 150);
    });
  } else {
    console.error('Team not found in tokenCache: ', teamId);
  }
}

async function getBotUserByTeam(teamId) {
  const { _, userCache } = await getTokens();
  if (userCache[teamId]) {
    return new Promise(resolve => {
      setTimeout(function() {
        resolve(userCache[teamId]);
      }, 150);
    });
  } else {
    console.error('Team not found in userCache: ', teamId);
  }
}
