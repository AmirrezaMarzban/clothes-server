const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const ForgetSchema = Schema({
    username: String, // phone or email
    password: String,
});

ForgetSchema.index({ created_at: 1 }, { expireAfterSeconds: 120 });  //after 5 minutes

module.exports = mongoose.model('Forget', ForgetSchema)