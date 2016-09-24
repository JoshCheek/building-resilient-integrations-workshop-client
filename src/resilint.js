'use strict'

module.exports = Resilint

const https = require('https')

function Resilint(options) {
  const agent = new https.Agent({keepAlive: true})

  const resilint = {
    baseUrl:          options.baseUrl,
    userName:         options.userName,
    userId:           options.userId,
    postRegistration: options.postRegistration,
    https:            https,
    agent:            agent,
  }

  if(!resilint.userId) {
    requestUserId(resilint, function(userId) {
      resilint.userId = userId
      resilint.postRegistration(userId)
    })
  }

  return resilint
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
  // req.setTimeout(1000, timeoutCb)
  req.end()
}
