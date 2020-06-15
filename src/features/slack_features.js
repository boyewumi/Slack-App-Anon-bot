/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const Message = require('../schema/message');
const User = require('../schema/user');
const { GetOAuthToken } = require('../oauth');

async function ConfirmUser(userId) {
  let user = {};
  const [foundUser] = await User.find({ user_id: userId });
  if (foundUser) {
    user = foundUser;
  }
  return user.user_id;
}

module.exports = function(controller) {
  controller.on('message', async (bot, message) => {
    if (!message.thread_ts) {
      return;
    }

    const [foundMessage] = await Message.find({
      message_timestamp: message.thread_ts,
      team_id: message.team,
    });
    if (!foundMessage) {
      return;
    }

    if (foundMessage.sender_id === message.user) {
      return await bot.replyEphemeral(
        message,
        'Oops! You just replied to your anonymous question! Run!'
      );
    }

    await bot.startPrivateConversation(foundMessage.sender_id);
    await bot.say(`
<@${message.user}> responded to your message:\`\`\`${foundMessage.message_body}\`\`\`
With:\`\`\`${message.text}\`\`\`
If this helped you, please mark the original message as resolved!`);
  });

  controller.on('message_action', async (bot, message) => {
    if (message.callback_id === 'resolve_question') {
      try {
        let uid = await ConfirmUser(message.user);
        if (message.user != uid) {
          return bot.replyPrivate(message, `You are not an authenticated user.`);
        }
      } catch (error) {
        console.log(error);
        return bot.replyPrivate(message, `Unable to fetch messages. Error occurred.`);
      }

      await Message.findOne(
        { message_timestamp: message.message_ts },
        async (err, foundMessage) => {
          if (err) {
            console.log(err);
            return;
          }
          try {
            //Post message Resolved
            await Promise.all([
              bot.api.chat.postMessage({
                token: await GetOAuthToken(message.team.id),
                ts: message.message_ts,
                channel: message.channel,
                text: foundMessage.message_body + ' has been RESOLVED',
              }),
            ]);
            return await bot.replyPrivate(message, `Message has been updated.`);
          } catch (error) {
            console.log(error);
            console.log(JSON.stringify(error));
            return await bot.replyPrivate(message, `Unable to update the message. Error occured.`);
          }
        }
      );
    }
  });
  controller.on('slash_command', async (bot, message) => {
    //code for slash command to speak anon to channel
    if (message.command === '/ask') {
      try {
        const [foundUser] = await User.find({
          user_id: message.user_id || message.user,
        });
        if (foundUser && foundUser.is_banned) {
          return bot.replyPrivate(message, `Unable to ask, you have been banned.`);
        }
      } catch (error) {
        return bot.replyPrivate(message, `Error occurred.`);
      }
      await bot.replyPublic(message, ` ${message.text}`).then(async () => {
        let teamId = bot.getConfig('activity').channelData.team_id;
        bot.api.conversations
          .history({
            token: await GetOAuthToken(teamId),
            channel: message.channel,
            limit: 1,
          })
          .then(res => {
            let messageInfo = res.messages[0];
            if (!messageInfo) {
              console.log('Unable to get message information.');
              return;
            }
            Message.create(
              {
                team_id: teamId,
                sender_id: message.user,
                message_timestamp: messageInfo.ts,
                message_body: message.text,
                channel_id: message.channel,
              },
              err => {
                if (err) throw err;
              }
            );
          })
          .catch(err => {
            if (err) console.log(err);
          });
      });
    }
    if (message.command === '/ask-block') {
      let user = {};
      try {
        const [foundUser] = await User.find({
          user_id: message.user_id || message.user,
        });
        if (foundUser) {
          user = foundUser;
        }
      } catch (error) {
        return bot.replyPrivate(message, `Unable to block. Error occurred.`);
      }
      if (!user.is_admin) {
        return bot.replyPrivate(message, `You are not a admin, you are not able to block users.`);
      }
      let str = message.text;
      const arrStr = str.split(/[ ,]+/);

      arrStr.forEach(async str => {
        const ifMatch = str.match(/(?!<@)([A-Z0-9]{9})\|(\w+)/g);
        if (!ifMatch) {
          return bot.replyPrivate(message, `Unable to block ${str}. Invalid user.`);
        }
        const [matchStr] = ifMatch;
        const [user_id, name] = matchStr.split('|');
        try {
          const user = await User.findOneAndUpdate({ user_id }, { is_banned: true });
          return await bot.replyPrivate(message, `Blocked ${name}`);
        } catch (error) {
          return bot.replyPrivate(message, `Unable to block ${name}. Error occurred.`);
        }
      });
    }
    if (message.command === '/ask-unblock') {
      let user = {};
      try {
        const [foundUser] = await User.find({
          user_id: message.user_id || message.user,
        });
        if (foundUser) {
          user = foundUser;
        }
      } catch (error) {
        return bot.replyPrivate(message, `Unable to unblock. Error occurred.`);
      }
      if (!user.is_admin) {
        return bot.replyPrivate(message, `You are not a admin, you are not able to unblock users.`);
      }
      let str = message.text;
      const arrStr = str.split(/[ ,]+/);

      arrStr.forEach(async str => {
        const ifMatch = str.match(/(?!<@)([A-Z0-9]{9})\|(\w+)/g);
        if (!ifMatch) {
          return bot.replyPrivate(message, `Unable to unblock ${str}. Invalid user.`);
        }
        const [matchStr] = ifMatch;
        const [user_id, name] = matchStr.split('|');
        try {
          const user = await User.findOneAndUpdate({ user_id }, { is_banned: false });
          return await bot.replyPrivate(message, `Unblocked ${name}.`);
        } catch (error) {
          return bot.replyPrivate(message, `Unable to unblock ${name}. Error occurred.`);
        }
      });
    }
  });
};
