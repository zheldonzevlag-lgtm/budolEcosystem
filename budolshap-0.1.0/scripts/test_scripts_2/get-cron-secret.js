const crypto = require('crypto')
const cronSecret = crypto.randomBytes(32).toString('hex')
console.log(cronSecret)
