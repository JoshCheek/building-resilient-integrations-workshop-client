#!/usr/bin/env node

const Resilint           = require('../src/resilint')
const fs                 = require('fs')
const dataFile           = "./data.js"
const concurrentRequests = 30
let   userId             = null

if (fs.existsSync(dataFile))
  userId = fs.readFileSync(dataFile, 'utf8')

const resilint = Resilint({
  baseUrl:          'resilient-integration-workshop.herokuapp.com',
  userName:         'JoshCheek',
  userId:           userId,
  timeout:          1,
  postRegistration: function(user_id) {
    fs.writeFileSync(dataFile, user_id)
  },
})

const startTime = new Date()
let   stored    = 0
let   found     = 0

const storeOptions = {
  success: function(bucketId, value) {
    stored += value
    const seconds = (new Date() - startTime) / 1000
    const rate    = stored / seconds
    const stats   = { seconds: seconds, stored: stored, goldPerSec: rate }
    console.log("Store success", stats)
  },
  failure: function(err, bucketId, value) {
    resilint.store(bucketId, value, storeOptions)
    console.log("Store failed, trying again")
  },
  ensure: function(bucketId, value) {
  },
}

const excavateOptions = {
  success: function({bucketId, type, units, value}) {
    if (1 <= value) {
      resilint.store(bucketId, value, storeOptions)
      console.log(`Excavate success storing ${value}`)
    } else {
      console.log(`Excavate success NOT storing ${value}`)
    }
  },
  failure: function() {
    console.log("Excavate fail")
  },
  ensure: function() {
    resilint.excavate(excavateOptions)
  },
}

for(let i = 0; i < concurrentRequests; ++i)
  resilint.excavate(excavateOptions)
