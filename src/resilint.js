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
  }

  if(!resilint.userId) {
    requestUserId(resilint, function(userId) {
      resilint.userId = userId
      resilint.postRegistration(userId)
    })
  }

  return resilint

  function excavate({success, failure, ensure}) {
    let error = null

    const requestOptions = {
      agent:    resilint.agent,
      hostname: resilint.baseUrl,
      method:   'POST',
      path:     '/v1/excavate',
      headers:  {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': '0'
      },
    }
    const errorCb = function(e) {
      if(error) return
      error = e
      failure(e)
      ensure()
    }
    const timeoutCb = function() {
      errorCb(new Error(`Timeout after ${resilint.timeout}ms`))
    }
    // Uhm, where does this go?
    // something.setTimeout(resilint.timeout, timeoutCb)

    const requestCb = function(res) {
      if(res.statusCode != 200) {
        errorCb(new Error(res.statusMessage))
        return
      }
      let body = ""
      res.setEncoding('utf8')
      res.on('data', (chunk) => body += chunk)
      res.on('error', errorCb)
      res.on('end', () => {
        if(error) return
        const parsed   = JSON.parse(body)
        const bucketId = parsed.bucketId
        const type     = "gold" in parsed ? "gold" : "dirt"
        const units    = parsed[type].units
        const value    = units // FIXME: should be zero for dirt
        success(bucketId, type, units, value)
        ensure()
      })
    }

    const req = https.request(requestOptions, requestCb)
    req.on('error', errorCb)
    req.end()
  }
}


function requestUserId(resilint, cb) {
  const requestOptions = {
    agent:    resilint.agent,
    hostname: resilint.baseUrl,
    method:   'POST',
    path:     `/v1/register?userName=${resilint.userName}`,
    headers:  {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': '0'
    },
  }
  const requestCb = function(res) {
    if(res.statusCode != 200) { } // maybe throw or smth?
    let body = ""
    res.setEncoding('utf8')
    res.on('data', (chunk) => body += chunk)
    res.on('end', () => cb(JSON.parse(body).user))
  }

  const errorCb = function(err) {
    console.log(`problem with request: ${err.message}`)
  }
  const timeoutCb = function() {
    console.log(`timeout`)
  }

  const req = https.request(requestOptions, requestCb)
  req.on('error', errorCb)
  // req.setTimeout(resilint.timeout, timeoutCb)
  req.end()
}
