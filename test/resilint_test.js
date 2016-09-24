'use strict'

const assert   = require('chai').assert;
const Resilint = require('../src/resilint.js')

describe('Resilint', function() {
  function clientFor(opts) {
    const mergedOpts = {
      baseUrl:          'https://example.com/test-base-url',
      userName:         'test-user-name',
      userId:           'test-user-id',
      timeout:          1000,
      postRegistration: function() {},
    }
    Object.assign(mergedOpts, opts)
    return Resilint(mergedOpts)
  }

  it('uses the provided baseUrl', function() {
    const url = 'https://example.com/custom-test-url'
    assert.equal(clientFor({baseUrl: url}).baseUrl, url)
  })

  it('remembers the provided userName', function() {
    const name = 'custom-username'
    assert.equal(clientFor({userName: name}).userName, name)
  })

  it('remembers the provided userId', function() {
    const id = 'custom-id'
    assert.equal(clientFor({userId: id}).userId, id)
  })

  describe('registration', function() {
    it('registers the userName and invokes the callback when no userId was provided')
    it('does not register the userName when a userId is provided')
  })

  describe('excavate (dig for gold)', function() {
    it('posts to the excavate endpoint')
    it('times out after the specified number of seconds, returning nil')
    it('invokes the success callback after a successful excavation, with the bucket id, type, units, and normalized vlaue')
    it('invokes the failure callback after a failed excavation')
    it('invokes the ensure callabck regardless of success or failure')
  })

  describe('storing', function() {
    it('posts to the store endpoint with the provided bucket id')
    it('times out after the specified number of seconds, returning nil')
    it('invokes the success callback after a successful excavation, with the bucket id and value')
    it('invokes the failure callback after a failed excavation, with the bucket id and value')
    it('invokes the ensure callabck regardless of success or failure, with the bucket id and value')
  })
})
