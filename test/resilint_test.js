'use strict'

const assert      = require('chai').assert
const sinon       = require('sinon')
const PassThrough = require('stream').PassThrough
const https       = require('https')
const Resilint    = require('../src/resilint.js')


describe('Resilint', function() {
	afterEach(function() {
		if(https.request.restore) {
      https.request.restore()
    }
	})

  function client() {
    return clientFor({})
  }

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
    it('registers the userName and invokes the callback when no userId was provided', function(done) {
      let expectedUserId = 'registered-user-id'
      let userName = 'mah-user'
      let baseUrl  = 'https://custom-base-url'

      // stub response
      let response = new PassThrough()
      response.write(JSON.stringify({user: expectedUserId, name: userName}))
      response.end()

      // stub request
      let request  = sinon.stub(https, 'request')
      request.callsArgWith(1, response).returns(new PassThrough())

      const client = clientFor({
        userId:           null,
        userName:         userName,
        baseUrl:          baseUrl,
        postRegistration: function(userId) {
          const options = request.getCall(0).args[0]
          assert.equal('POST',                           options.method)
          assert.equal(baseUrl,                          options.hostname)
          assert.equal("/v1/register?userName=mah-user", options.path)
          assert.equal(expectedUserId, userId)
          done()
        },
      })
    })

    it('does not register the userName when a userId is provided', function() {
      // stub response
      let response = new PassThrough()
      response.write(JSON.stringify({user: 'id-that-is-not-requested', name: 'someone else'}))
      response.end()

      // stub request
      let request  = sinon.stub(https, 'request')
      request.callsArgWith(1, response).returns(new PassThrough())

      // client makes the request
      const client = clientFor({
        userId:           'existing-user-id',
        userName:         'mah user',
        postRegistration: function(userId) {
          throw("Should not have been called!")
        },
      })
    })
  })

  describe('excavate (dig for gold)', function() {
    it('posts to the excavate endpoint', function(done) {
      const expectedBucketId = 'expected-bucket-id'
      const expectedType     = 'gold'
      const expectedUnits    = 3
      const expectedValue    = 3

      const response = new PassThrough()
      response.write(JSON.stringify({
        bucketId: expectedBucketId,
        [expectedType]: {units: expectedUnits}
      }))
      response.end()

      const request  = sinon.stub(https, 'request')
      request.callsArgWith(1, response).returns(new PassThrough())

      let successArgs = []

      clientFor({baseUrl: 'custom-base-url'}).excavate({
        success: function(bucketId, type, units, value) {
          successArgs = [bucketId, type, units, value]
        },
        failure: function(bucketId, type, units, value) {
          throw("Should not have failed!")
        },
        ensure: function(bucketId, type, units, value) {
          const expectedArgs = [expectedBucketId, expectedType, expectedUnits, expectedValue]
          assert.deepEqual(successArgs, expectedArgs)
          assert.deepEqual([bucketId, type, units, value], expectedArgs)
          const options = request.getCall(0).args[0]
          assert.equal('POST',            options.method)
          assert.equal('custom-base-url', options.hostname)
          assert.equal("/v1/excavate",    options.path)
          done()
        },
      })
    })

    it('times out after the specified number of seconds, invoking the failure and ensure callbacks')
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
