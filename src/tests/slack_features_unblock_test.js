'use strict';
const assert = require('assert');
const { BotMock, SlackApiMock } = require('botkit-mock');
const AxiosMockAdapter = require('axios-mock-adapter');
const axios = require('axios');

const {
  SlackAdapter,
  SlackMessageTypeMiddleware,
  SlackEventMiddleware,
} = require('botbuilder-adapter-slack');
const fileBeingTested = require('../features/slack_features');
var sinon = require('sinon');
var mongoose = require('mongoose');
require('sinon-mongoose');

const Message = require('../schema/message');
var MessageMock = sinon.mock(Message);
const User = require('../schema/user');
var UserMock = sinon.mock(User);

describe('Integration tests /ask_unblock', () => {
  const initController = async () => {
    const adapter = new SlackAdapter({
      clientSigningSecret: 'somesecret',
      botToken: 'sometoken',
      debug: true,
    });
    adapter.use(new SlackEventMiddleware());
    adapter.use(new SlackMessageTypeMiddleware());

    this.controller = new BotMock({
      adapter: adapter,
    });

    SlackApiMock.bindMockApi(this.controller);

    fileBeingTested(this.controller);
  };

  beforeEach(() => {});
  after(() => {
    UserMock.restore();
    MessageMock.restore();
  });
  describe('/ask_unblock', () => {
    beforeEach(() => {
      initController();
    });
    it(`/ask-unblock should not unblock when user is not admin`, async () => {
      UserMock.expects('find')
        .withArgs({ user_id: 'user123' })
        .returns([
          {
            is_admin: false,
          },
        ]);

      const text = '<@UNBU4TU7L|user>';
      const response_url = 'response_url/public';
      await this.controller.usersInput([
        {
          type: 'slash_command',
          user: 'user123', //user required for each direct message
          channel: 'channel123', // user channel required for direct message
          messages: [
            {
              command: '/ask-unblock',
              text: text,
              isAssertion: true,
              response_url,
              team_id: 'test',
            },
          ],
        },
      ]);
      const reply = this.controller.apiLogByKey[response_url][0];
      assert.strictEqual(reply.text, 'You are not a admin, you are not able to unblock users.');
      assert.strictEqual(reply.channelData.response_type, 'ephemeral', 'should be private message');
    });
    it(`/ask-unblock should fail if user is not found on db`, async () => {
      UserMock.expects('find').withArgs({ user_id: null });

      const text = '<@UNBU4TU7L|user>';
      const response_url = 'response_url/public';
      await this.controller.usersInput([
        {
          type: 'slash_command',
          user: 'user123', //user required for each direct message
          channel: 'channel123', // user channel required for direct message
          messages: [
            {
              command: '/ask-unblock',
              text: text,
              isAssertion: true,
              response_url,
              team_id: 'test',
              user_id: 'user123',
            },
          ],
        },
      ]);
      const reply = this.controller.apiLogByKey[response_url][0];
      assert.strictEqual(reply.text, 'Unable to unblock. Error occurred.');
      assert.strictEqual(reply.channelData.response_type, 'ephemeral', 'should be private message');
    });
    it(`/ask-unblock should reject when trying to unblock invalid user`, async () => {
      UserMock.expects('find')
        .withArgs({ user_id: 'user123' })
        .returns([
          {
            is_admin: true,
          },
        ]);

      const text = 'fasdfsdafasf';
      const response_url = 'response_url/public';
      await this.controller.usersInput([
        {
          type: 'slash_command',
          user: 'user123', //user required for each direct message
          channel: 'channel123', // user channel required for direct message
          messages: [
            {
              command: '/ask-unblock',
              text: text,
              isAssertion: true,
              response_url,
              team_id: 'test',
            },
          ],
        },
      ]);
      const reply = this.controller.apiLogByKey[response_url][0];
      assert.strictEqual(reply.text, 'Unable to unblock fasdfsdafasf. Invalid user.');
      assert.strictEqual(reply.channelData.response_type, 'ephemeral', 'should be private message');
    });
    it(`/ask-unblock should unblock 1 person`, async () => {
      UserMock.expects('find')
        .withArgs({ user_id: 'user123' })
        .returns([
          {
            is_admin: true,
          },
        ]);
      UserMock.expects('findOneAndUpdate').withArgs({ user_id: 'UNBU4TU7L' }, { is_banned: false });

      const text = '<@UNBU4TU7L|user>';
      const response_url = 'response_url/public';
      await this.controller.usersInput([
        {
          type: 'slash_command',
          user: 'user123', //user required for each direct message
          channel: 'channel123', // user channel required for direct message
          messages: [
            {
              command: '/ask-unblock',
              text: text,
              isAssertion: true,
              response_url,
              team_id: 'test',
            },
          ],
        },
      ]);
      const reply = this.controller.apiLogByKey[response_url][0];
      assert.strictEqual(reply.text, 'Unblocked user.');
      assert.strictEqual(reply.channelData.response_type, 'ephemeral', 'should be private message');
    });
    it(`/ask-unblock should unblock multiple people`, async () => {
      UserMock.expects('find')
        .withArgs({ user_id: 'user123' })
        .returns([
          {
            is_admin: true,
          },
        ]);
      UserMock.expects('findOneAndUpdate').withArgs({ user_id: 'UNBU4TU7L' }, { is_banned: false });
      UserMock.expects('findOneAndUpdate').withArgs({ user_id: 'UNBU4TU7O' }, { is_banned: false });

      const text = '<@UNBU4TU7L|user1> <@UNBU4TU7O|user2>';
      const response_url = 'response_url/public';
      await this.controller.usersInput([
        {
          type: 'slash_command',
          user: 'user123', //user required for each direct message
          channel: 'channel123', // user channel required for direct message
          messages: [
            {
              command: '/ask-unblock',
              text: text,
              isAssertion: true,
              response_url,
              team_id: 'test',
            },
          ],
        },
      ]);
      const reply1 = this.controller.apiLogByKey[response_url][0];
      assert.strictEqual(reply1.text, 'Unblocked user1.');
      const reply2 = this.controller.apiLogByKey[response_url][1];
      assert.strictEqual(reply2.text, 'Unblocked user2.');

      assert.strictEqual(
        reply1.channelData.response_type,
        'ephemeral',
        'should be private message'
      );
      assert.strictEqual(
        reply2.channelData.response_type,
        'ephemeral',
        'should be private message'
      );
    });
    it(`/ask-unblock should try unblock 1 person but not available on db`, async () => {
      UserMock.expects('find')
        .withArgs({ user_id: 'user123' })
        .returns([
          {
            is_admin: true,
          },
        ]);

      const text = '<@UNBU4TU7L|user>';
      const response_url = 'response_url/public';
      await this.controller.usersInput([
        {
          type: 'slash_command',
          user: 'user123', //user required for each direct message
          channel: 'channel123', // user channel required for direct message
          messages: [
            {
              command: '/ask-unblock',
              text: text,
              isAssertion: true,
              response_url,
              team_id: 'test',
            },
          ],
        },
      ]);
      const reply = this.controller.apiLogByKey[response_url][0];
      assert.strictEqual(reply.text, 'Unable to unblock user. Error occurred.');
      assert.strictEqual(reply.channelData.response_type, 'ephemeral', 'should be private message');
    });
    it(`/ask-unblock should try to unblock multiple people but one is invalid`, async () => {
      UserMock.expects('find')
        .withArgs({ user_id: 'user123' })
        .returns([
          {
            is_admin: true,
          },
        ]);
      UserMock.expects('findOneAndUpdate').withArgs({ user_id: 'UNBU4TU7L' }, { is_banned: false });
      UserMock.expects('findOneAndUpdate').withArgs({ user_id: 'UNBU4TU7O' }, { is_banned: false });

      const text = '<@UNBU4TU7L|user1> <@UNBU4TU7O|user2> fadsfasdfasdfsadfsdfsf';
      const response_url = 'response_url/public';
      await this.controller.usersInput([
        {
          type: 'slash_command',
          user: 'user123', //user required for each direct message
          channel: 'channel123', // user channel required for direct message
          messages: [
            {
              command: '/ask-unblock',
              text: text,
              isAssertion: true,
              response_url,
              team_id: 'test',
            },
          ],
        },
      ]);
      const reply0 = this.controller.apiLogByKey[response_url][0];
      assert.strictEqual(reply0.text, 'Unable to unblock fadsfasdfasdfsadfsdfsf. Invalid user.');
      const reply1 = this.controller.apiLogByKey[response_url][1];
      assert.strictEqual(reply1.text, 'Unblocked user1.');

      const reply2 = this.controller.apiLogByKey[response_url][2];
      assert.strictEqual(reply2.text, 'Unblocked user2.');

      assert.strictEqual(
        reply1.channelData.response_type,
        'ephemeral',
        'should be private message'
      );
      assert.strictEqual(
        reply2.channelData.response_type,
        'ephemeral',
        'should be private message'
      );
    });
  });
});
