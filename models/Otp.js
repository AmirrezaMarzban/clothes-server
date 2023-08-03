const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const OtpSchema = Schema({
    username: String, // phone or email
    code: String,
});

OtpSchema.index({ created_at: 1 }, { expireAfterSeconds: 120 });  //after 2 minutes

module.exports = mongoose.model('Otp', OtpSchema)