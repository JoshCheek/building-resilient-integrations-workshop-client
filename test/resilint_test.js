'use strict'

const assert   = require('chai').assert;
const Resilint = require('../src/resilint.js')

describe('Resilint', function() {
  it('uses the provided baseUrl')
  it('remembers the provided userName')
  it('remembers the provided userId')

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
