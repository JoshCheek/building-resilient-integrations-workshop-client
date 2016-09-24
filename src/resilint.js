'use strict'

module.exports = Resilint

const https = require('https')

function Resilint(options) {
  const agent = new https.Agent({keepAlive: true})

  const resilint = {
    baseUrl:          options.baseUrl,
    userName:         options.userName,
    userId:           options.userId,
    timeout:          options.timeout,
    postRegistration: options.postRegistration,
    https:            https,
    agent:            agent,
    excavate:         excavate,
    store:            store,
  }

  if(!resilint.userId)
    requestUserId((userId) => {
      resilint.userId = userId
      resilint.postRegistration(userId)
    })

  return resilint

  function excavate({success, failure, ensure}) {
    request('/v1/excavate', successCb, errorCb)
    function successCb(body) {
      const parsed   = JSON.parse(body)
      const bucketId = parsed.bucketId
      const type     = "gold" in parsed ? "gold" : "dirt"
      const units    = parsed[type].units
      const value    = units // FIXME: should be zero for dirt
      success(bucketId, type, units, value)
      ensure()
    }
    function errorCb(error) {
      failure(error)
      ensure()
    }
  }

  function store(bucketId, units, {success, failure, ensure}) {
    request(`/v1/store?userId=${resilint.userId}&bucketId=${bucketId}`, successCb, errorCb)
    function successCb(body) {
      success(bucketId, units)
      ensure(bucketId, units)
    }
    function errorCb(err) {
      failure(err, bucketId, units)
      ensure(bucketId, units)
    }
  }

  function requestUserId(userIdCb) {
    request(`/v1/register?userName=${resilint.userName}`, successCb, errorCb)
    function successCb(body) {
      const json   = JSON.parse(body)
      const userId = json.user
      userIdCb(userId)
    }
    function errorCb(err) {
      throw(err)
    }
  }

  function request(path, onSuccess, onError) {
    let error = null

    const requestOptions = {
      agent:    resilint.agent,
      hostname: resilint.baseUrl,
      method:   'POST',
      path:     path,
      headers:  {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': '0'
      },
    }

    const errorCb = function(e) {
      if(error) return
      error = e
      onError(e)
    }

    // Uhm, where does this go?
    // something.setTimeout(resilint.timeout, timeoutCb)
    // const timeoutCb = function() {
    //   errorCb(new Error(`Timeout after ${resilint.timeout}ms`))
    // }

    const requestCb = function(response) {
      if(response.statusCode != 200) {
        errorCb(new Error(response.statusMessage))
        return
      }
      let body = ""
      response.setEncoding('utf8')
      response.on('data', (chunk) => body += chunk)
      response.on('error', errorCb)
      response.on('end', () => error || onSuccess(body))
    }

    const request = https.request(requestOptions, requestCb)
    request.on('error', errorCb)
    request.end()
  }
}
