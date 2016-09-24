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
      let expected = 'registered-user-id'
      let userName = 'mah user'

      // stub response
      let response = new PassThrough()
      response.write(JSON.stringify({user: expected, name: userName}))
      response.end()

      // stub request
      let request  = sinon.stub(https, 'request')
      request.callsArgWith(1, response).returns(new PassThrough())

      // client makes the request
      const client = clientFor({
        userId:           null,
        userName:         userName,
        postRegistration: function(userId) {
          assert.equal(expected, userId)
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
