const https = require('https')
const agent = new https.Agent({
  keepAlive: true,
})

const options = {
  agent:    agent,
  hostname: 'resilient-integration-workshop.herokuapp.com',
  method:   'POST',
  path:     '/v1/excavate',
  headers:  {
    'Content-Type':   'application/x-www-form-urlencoded',
    'Content-Length': '0'
  }
}

const requestCb = function(res) {
  console.log(`STATUS: ${res.statusCode}`)
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`)
  res.setEncoding('utf8')
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`)
  })
  res.on('end', () => {
    console.log('No more data in response.')
  })
}

const errorCb = function(err) {
  console.log(`problem with request: ${err.message}`)
}

const timeoutCb = function() {
  console.log(`timeout`)
}

const reqs = []

for(let i = 0; i < 3; ++i) {
  var req = https.request(options, requestCb)
  req.on('error', errorCb)
  req.setTimeout(1000, timeoutCb)
  req.end()
  reqs.push(req)
}
