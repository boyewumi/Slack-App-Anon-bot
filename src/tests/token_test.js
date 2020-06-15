'use strict';
const assert = require('assert');
var sinon = require('sinon');

// const token = require('../token');
const fsp = require('fs').promises;
const fs = require('fs');

describe('unit tests token', () => {
  let sandbox = null;
  let token = null;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    token = require('../token');
    this.cStub2 = sinon.stub(console, 'log');
  });

  afterEach(() => {
    sandbox.restore();
    delete require.cache[require.resolve('../token')];
    this.cStub2.restore();
  });
  it('getTokens should return oauth from token file', async () => {
    sandbox.stub(fsp, 'access').returns(true);
    sandbox.stub(fsp, 'readFile').returns('[{"test":"test"},{"test2":"test"}]');

    const returnVal = await token.getTokens();
    const expected = {
      tokenCache: {
        test: 'test',
      },
      userCache: {
        test2: 'test',
      },
    };
    assert.equal(returnVal.tokenCache.test, 'test');
    assert.equal(returnVal.userCache.test2, 'test');
  });
  it("getTokens should return empty objects if file doesn't exist", async () => {
    sandbox.stub(fsp, 'access').throws();
    const returnVal = await token.getTokens();
    assert.deepEqual(returnVal.tokenCache, {});
    assert.deepEqual(returnVal.userCache, {});
  });
  it('getTokens should throw error if issues reading the file', async () => {
    sandbox.stub(fsp, 'access').returns(true);
    sandbox.stub(fsp, 'readFile').throws();
    const returnVal = await token.getTokens();
    assert.deepEqual(returnVal.tokenCache, {});
    assert.deepEqual(returnVal.userCache, {});
  });
  it('setTokens should set token and write to file', async () => {
    sandbox.stub(fsp, 'access').returns(true);
    sandbox.stub(fsp, 'readFile').returns('[{"test":"test"},{"test2":"test"}]');
    sandbox.stub(fs, 'writeFileSync').returns(true);

    const returnVal = await token.setTokens();
    const expected = {
      tokenCache: {
        test: 'test',
      },
      userCache: {
        test2: 'test',
      },
    };
    assert.equal(returnVal, undefined);
  });
});
