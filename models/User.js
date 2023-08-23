const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

function profile(img) {
    if (img) return '/uploads/images/user/' + img
}

const UserSchema = Schema({
    scope: { type: Array, default: ['user'] },    //admin, user
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    mobile: { type: String, unique: true, required: true },
    password: { type: String, default: null },
    nationalCode: { type: String, required: true },
    province: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: Boolean, required: true }, // 1 male, 0 female
    token: { type: String, default: null },
    profilepic: { type: String, default: null, get: profile },
    active: { type: Boolean, default: true },
    registration_done: { type: Boolean, default: false },
    mobile_email_confirmation_done: { type: Boolean, default: false }, // mobile or email confirmation depends on country must be done
});


UserSchema.pre('findOneAndUpdate', function (next) {
    if (this.getUpdate().password) {
        let salt = bcrypt.genSaltSync(15);
        let hash = bcrypt.hashSync(this.getUpdate().password, salt);

        this.getUpdate().password = hash;
    }
    next();
});

UserSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
}

UserSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', UserSchema)