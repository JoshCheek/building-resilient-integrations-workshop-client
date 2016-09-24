'use strict'

module.exports = Resilint

function Resilint(options) {
  return {
    baseUrl:  options.baseUrl,
    userName: options.userName,
    userId:   options.userId,
  }
}
