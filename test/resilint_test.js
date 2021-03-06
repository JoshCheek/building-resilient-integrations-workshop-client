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
      response.statusCode = 200
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
      const response = new PassThrough()
      response.statusCode = 200
      response.write(JSON.stringify({bucketId: 'id', gold: {units: 1}}))
      response.end()

      const request = sinon.stub(https, 'request')
      request.callsArgWith(1, response).returns({
        on: function() {},
        end: function(){},
        setTimeout: function() { },
      })

      clientFor({baseUrl: 'custom-base-url'}).excavate({
        success: function() {},
        failure: function() {},
        ensure:  function() {
          const options = request.getCall(0).args[0]
          assert.equal('POST',            options.method)
          assert.equal('custom-base-url', options.hostname)
          assert.equal("/v1/excavate",    options.path)
          done()
        },
      })
    })

    describe('after a successful invocation', function() {
      it('invokes the success cb with the bucket id, type, units, and normalized value, and invokes the ensure callback', function(done) {
        const expectedBucketId = 'expected-bucket-id'
        const expectedType     = 'gold'
        const expectedUnits    = 3
        const expectedValue    = 3

        const response = new PassThrough()
        response.statusCode = 200
        response.write(JSON.stringify({
          bucketId: expectedBucketId,
          [expectedType]: {units: expectedUnits}
        }))
        response.end()

        const request = sinon.stub(https, 'request')
        request.callsArgWith(1, response).returns(new PassThrough())

        let successInvoked = false
        client().excavate({
          success: function({bucketId, type, units, value}) {
            successInvoked = true
            assert.deepEqual(
              [bucketId, type, units, value],
              [expectedBucketId, expectedType, expectedUnits, expectedValue]
            )
          },
          failure: function(err) { throw("Should not have failed!") },
          ensure:  function() {
            assert.equal(true, successInvoked)
            done()
          },
        })
      })

      describe('value', function() {
        specify('0 for dirt', function() {
          const normalized = client().normalizeExcavation({bucketId: 'a', dirt: {units: 4}})
          assert.equal('a',    normalized.bucketId)
          assert.equal('dirt', normalized.type)
          assert.equal(4,      normalized.units)
          assert.equal(0,      normalized.value)
        })
        specify('the value of gold, for gold', function() {
          const normalized = client().normalizeExcavation({bucketId: 'b', gold: {units: 3}})
          assert.equal('b',    normalized.bucketId)
          assert.equal('gold', normalized.type)
          assert.equal(3,      normalized.units)
          assert.equal(3,      normalized.value)
        })
      })
    })

    describe('after a failed invocation, it invokes the failure and ensure callbacks', function() {
      specify('when failed from a status code', function(done) {
        const response = new PassThrough()
        response.statusCode = 404
        response.statusMessage = 'Not found'
        response.end()

        sinon.stub(https, 'request').callsArgWith(1, response).returns(new PassThrough())

        let failureCalled = false
        client().excavate({
          success: function()    { throw("Should not have failed!") },
          failure: function(err) {
            failureCalled = true
            assert.equal('Not found', err.message)
          },
          ensure:  function() {
            assert.equal(true, failureCalled)
            done()
          },
        })
      })

      // failed due to some other reason gets handed to the errorCb
      specify('when failed from a stream error', function(done) {
        sinon.stub(https, 'request').returns({
          on: function(type, cb) {
          if(type === 'error')
            cb(new Error('some failure'))
          },
          end: function(){},
          setTimeout: function() {},
        })

        let failureCalled = false
        client().excavate({
          success: function()    { throw("Should not have failed!") },
          failure: function(err) {
            failureCalled = true
            assert.equal('some failure', err.message)
          },
          ensure:  function() {
            assert.equal(true, failureCalled)
            done()
          },
        })
      })

      // timeout calls the timeoutCb
      xspecify('when failed from a timeout', function(done) {
        const expectedTimeout = 1223

        sinon.stub(https, 'request').returns({
          on: function() {},
          end: function(){},
          setTimeout: function(timeout, cb) {
            assert.equal(expectedTimeout, timeout)
            cb()
          },
        })

        let failureCalled = false
        clientFor({timeout: expectedTimeout}).excavate({
          success: function()    { throw("Should not have failed!") },
          failure: function(err) {
            failureCalled = true
            assert.equal(`timeout after ${expectedTimeout}ms`, err.message)
          },
          ensure:  function() {
            assert.equal(true, failureCalled)
            done()
          },
        })
      })
    })
  })

  describe('storing', function() {
    it('posts to the store endpoint with the provided bucket id', function(done) {
      const response = new PassThrough()
      response.statusCode = 200
      response.write('true') // this is what it returns
      response.end()

      const request = sinon.stub(https, 'request')
      request.callsArgWith(1, response).returns({
        on:         function() {},
        end:        function() {},
        setTimeout: function() {},
      })

      clientFor({userId: "uid", baseUrl: 'custom-base-url'}).store('bid', 222, {
        success: function(bucketId, value) {},
        failure: function(err, bucketId, value) {},
        ensure:  function(bucketId, value) {
          const options = request.getCall(0).args[0]
          assert.equal('POST',            options.method)
          assert.equal('custom-base-url', options.hostname)
          assert.equal(`/v1/store?userId=uid&bucketId=bid`, options.path)
          done()
        },
      })
    })

    xit('times out after the specified number of seconds, calling the failure and esnure callbacks')

    it('invokes the success and ensure callbacks after a successful excavation', function(done) {
      const response = new PassThrough()
      response.statusCode = 200
      response.write('true') // this is what it returns
      response.end()

      const request = sinon.stub(https, 'request')
      request.callsArgWith(1, response).returns({
        on:         function() {},
        end:        function() {},
        setTimeout: function() {},
      })

      let successCalled = false
      client().store('bid', 222, {
        success: function(bucketId, value) {
          successCalled = true
          assert.equal('bid', bucketId)
          assert.equal(222, value)
        },
        failure: function(err, bucketId, value) {
          throw("Err should not have been called!")
        },
        ensure:  function(bucketId, value) {
          assert.equal(true,  successCalled)
          assert.equal('bid', bucketId)
          assert.equal(222,   value)
          done()
        },
      })
    })

    it('invokes the failure callback and ensure after a failed excavation', function(done) {
      const response = new PassThrough()
      response.statusCode = 500
      response.statusMessage = 'Internal Server Error'
      response.end()

      const request = sinon.stub(https, 'request')
      request.callsArgWith(1, response).returns({
        on:         function() {},
        end:        function() {},
        setTimeout: function() {},
      })

      let failureCalled = false
      client().store('bktid', 132, {
        success: function(bucketId, value) {
          throw("Err should not have been called!")
        },
        failure: function(err, bucketId, value) {
          failureCalled = true
          assert.equal('Internal Server Error', err.message)
          assert.equal('bktid', bucketId)
          assert.equal(132, value)
        },
        ensure: function(bucketId, value) {
          assert.equal(true,    failureCalled)
          assert.equal('bktid', bucketId)
          assert.equal(132,     value)
          done()
        },
      })
    })
  })
})
