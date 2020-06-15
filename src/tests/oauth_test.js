'use strict';
const assert = require('assert');
var sinon = require('sinon');

const token = require('../token');
const oauth = require('../oauth');

describe('unit tests oauth', () => {
  let sandbox = null;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });
  it('should return oauth from token file', async () => {
    const getTokenStub = sandbox.stub(token, 'getTokens').returns({
      tokenCache: {
        test: {
          oauth_access: 'oauth_access_test',
        },
      },
    });

    const returnVal = await oauth.GetOAuthToken('test');
    assert.equal(returnVal, 'oauth_access_test');
  });
  it("should console.error if team id doesn't match", async () => {
    const getTokenStub = sandbox.stub(token, 'getTokens').returns({
      tokenCache: {
        test_12: {
          oauth_access: 'oauth_access_test',
        },
      },
    });
    const spy = sandbox.spy(console, 'error');

    const returnVal = await oauth.GetOAuthToken('test');
    assert(spy.calledOnce);
    assert.notEqual(returnVal, 'oauth_access_test');
  });
});
