'use strict'

module.exports = Resilint

const https = require('https')

function Resilint(options) {
  const agent = new https.Agent({keepAlive: true})

  const resilint = {
    baseUrl:             options.baseUrl,
    userName:            options.userName,
    userId:              options.userId,
    timeout:             options.timeout,
    postRegistration:    options.postRegistration,
    https:               https,
    agent:               agent,
    excavate:            excavate,
    store:               store,
    normalizeExcavation: normalizeExcavation,
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
      success(normalizeExcavation(JSON.parse(body)))
      ensure()
    }
    function errorCb(error) {
      failure(error)
      ensure()
    }
  }

  function normalizeExcavation(parsed) {
    const bucketId = parsed.bucketId
    if('gold' in parsed) {
      const units = parsed['gold'].units
      return {bucketId, units, type: 'gold', value: units}
    } else {
      const units = parsed['dirt'].units
      return {bucketId, units, type: 'dirt', value: 0}
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
      userIdCb(JSON.parse(body).user)
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
      headers:  {'Content-Length': '0', 'Content-Type': 'application/x-www-form-urlencoded'},
    }

    const errorCb = function(e) {
      if(error) return
      onError(error = e)
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
      response.on('data',  (chunk) => body += chunk)
      response.on('error', errorCb)
      response.on('end',   () => error || onSuccess(body))
    }

    const request = https.request(requestOptions, requestCb)
    request.on('error', errorCb)
    request.end()
  }
}
