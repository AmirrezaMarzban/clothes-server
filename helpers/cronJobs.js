// const User = require('../models/User')
const CronJob = require('cron').CronJob
// const {sms} = require('./../SMSModule')

const minute = 1000 * 60
const hour = minute * 60
const day = hour * 24

module.exports = {
  removeUser: () => {
    // check users for activation
    setInterval(() => {
      User.find({registration_done: false})
         .then(users => {
           if (users.length) {
             ///////////////////////
             users.forEach((item, index) => {
               // item time and timeout
               const itemTime = Date.parse(item.created_at)
               const timeout = itemTime + day
               ////////////////////////////
               if (Date.now() >= timeout) {
                 item.remove()
               }
               if (index === users.length - 1) {
                 // console.log('Unconfirmed users deleted.')
               }
             })
           }
         })
         .catch(err => {
           console.log(err)
         })
    }, hour)
  },
}
