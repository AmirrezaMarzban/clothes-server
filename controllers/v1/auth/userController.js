const mongoose = require('mongoose')
const User = require('../../../models/User')
const Otp = require('../../../models/Otp')
const Forget = require('../../../models/Forget')
const { signJWT } = require('../../../helpers/genJwt')
const { body, validationResult } = require('express-validator')
const { _sr } = require('../../../helpers/serverResponses')
const { iranCities } = require('../../../helpers/countries')
const { res200, res201, res401, res403, res404, res422, res500, checkValidations } = require('../../../helpers/statusCodes')
const { isPhoneNumberValid, isEmailValid, checkNationalCode, generateRandomDigits } = require('../../../helpers/controllersHelperFunctions')
const { sendMail, sendSms } = require('../../../helpers/otp')

///////// buyer user auth
module.exports.loginProcess = [
    [
        body('username')
            .notEmpty().withMessage(_sr['fa'].required.username),
        body('password')
            .notEmpty().withMessage(_sr['fa'].required.password),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const user = await User.findOne({ $or: [{ email: req.body.username }, { mobile: req.body.username }] })
            if (!user || !user.comparePassword(req.body.password)) return res401(res, _sr[req.lang].not_found.user_id)
            const tokenObject = signJWT({ sub: user._id });
            await User.findByIdAndUpdate(user.id, { token: tokenObject.token.split(' ')[1] })
            if (!user.registration_done)
                return res403(res, _sr[req.lang].response.not_logged_in)
            else if (!user.mobile_email_confirmation_done) {
                const otp = Otp.findOne({ $or: [{ username: user.email }, { username: user.mobile }] })
                if (!otp) {
                    let code = generateRandomDigits(6)
                    let message = `به فروشگاه آنلاین لباس خوش آمدید. کد فعالسازی: ${code} لغو 11`
                    sendSms(user.mobile, message)
                    await Otp.create({ username: user.mobile, code: code })
                }
                return res401(res, _sr[req.lang].response.verify_account)
            }
            return res200(res, { msg: _sr[req.lang].response.logged_in, token: tokenObject.token })
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.normalRegisterProcess = [
    [
        body('firstName')
            .notEmpty().withMessage(_sr['fa'].required.first_name),
        body('lastName')
            .notEmpty().withMessage(_sr['fa'].required.last_name),
        body('email')
            .notEmpty().withMessage(_sr['fa'].required.email)
            .bail()
            .isEmail().withMessage(_sr['fa'].format.email)
            .bail()
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then(user => {
                        if (user) return Promise.reject(_sr[req.lang].duplicated.email)
                        else return true
                    })
            }),
        body('mobile')
            .notEmpty().withMessage(_sr['fa'].required.mobile_number)
            .bail()
            .custom((value, { req }) => {
                if (!isPhoneNumberValid(value))
                    throw new Error(_sr[req.lang].format.phone_number)
                return User.findOne({ mobile: value })
                    .then(user => {
                        if (user) return Promise.reject(_sr[req.lang].duplicated.phone_number)
                        else return true
                    })
            }),
        body('birthDate')
            .notEmpty().withMessage(_sr['fa'].required.birthdate),
        body('gender')
            .notEmpty().withMessage(_sr['fa'].required.gender),
        body('nationalCode')
            .notEmpty().withMessage(_sr['fa'].required.national_code)
            .bail()
            .custom((value, { req }) => {
                if (!checkNationalCode(value))
                    throw new Error(_sr[req.lang].format.national_code)
                return User.findOne({ nationalCode: value })
                    .then(user => {
                        if (user) return Promise.reject(_sr[req.lang].duplicated.national_code)
                        else return true
                    })
            }),
        body('province')
            .notEmpty().withMessage(_sr['fa'].required.province)
            .bail()
            .custom((value, { req }) => {
                for (var i = 0; i < iranCities.length; i++) {
                    if (iranCities[i].name === value)
                        return true
                }
                throw new Error(_sr['fa'].required.province)
            }),
        body('city')
            .notEmpty().withMessage(_sr['fa'].required.city)
            .bail()
            .custom((value, { req }) => {
                for (var i = 0; i < iranCities.length; i++) {
                    if (iranCities[i].name === req.body.province) {
                        if (iranCities[i].cities.includes(value))
                            return true
                    }
                }
                throw new Error(_sr['fa'].required.city)
            }),
        body('address')
            .isLength({ min: 10 }).withMessage(_sr['fa'].min_char.min10),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            let { firstName, lastName, email, mobile, nationalCode, country, province, city, address, birthdate, gender } = req.body
            const tUser = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                mobile: mobile,
                nationalCode: nationalCode,
                country: country,
                province: province,
                city: city,
                address: address,
                birthDate: Date.now(), // this is temporary
                gender: gender
            }
            const tokenObject = signJWT(tUser); // temporary token
            tUser.token = tokenObject.token.split(' ')[1]
            await User.create(tUser)
            // send sms with SMS Api panel code
            let code = generateRandomDigits(6)
            let message = `به فروشگاه آنلاین خوش آمدید. کد فعالسازی: ${code} لغو 11`
            sendSms(mobile, message)
            await Otp.create({ username: mobile, code: code })
            return res201(res, _sr[req.lang].response.activation_code)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]
///////// buyer user auth

module.exports.verifyOtp = [
    [
        body('code')
            .notEmpty().withMessage(_sr['fa'].response.problem)
            .bail()
            .isLength({ max: 6 }).withMessage(_sr['fa'].required.problem),
        body('username')
            .notEmpty().withMessage(_sr['fa'].required.username)
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const otp = await Otp.findOne({
                $and: [
                    { username: req.body.username },
                    { code: req.body.code }
                ]
            })
            if (!otp)
                return res422(res, _sr[req.lang].response.wrong_activation_code)

            const user = await User.findOneAndUpdate({ $or: [{ email: otp.username }, { mobile: otp.username }] }, { mobile_email_confirmation_done: true })
            await Otp.deleteOne(otp)
            return res200(res, { msg: _sr[req.lang].response.success_activation, token: user.token })
        } catch (e) {
            console.log(e);
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.tryAgainOtp = [
    [
        body('username')
            .notEmpty().withMessage(_sr['fa'].required.username)
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const otp = await Otp.findOne({ username: req.body.username })
            const user = await User.findOne({ $or: [{ email: req.body.username }, { mobile: req.body.username }] })
            if (!user || user.mobile_email_confirmation_done)
                return res404(res, _sr[req.lang].not_found.user_id)
            if (!otp) {         // check otp for user is expired
                // send sms with SMS Api panel code
                let code = generateRandomDigits(6)
                let message = `به فروشگاه آنلاین لباس خوش آمدید. کد فعالسازی: ${code} لغو 11`
                sendSms(user.mobile, message)
                await Otp.create({ username: user.mobile, code: code })
                return res201(res, _sr[req.lang].response.activation_code)
            }
            return res403(res, _sr[req.lang].response.has_sent_activation_code)
        } catch (e) {
            console.log(e);
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.forgetPassword = [
    [
        body('username')
            .notEmpty().withMessage(_sr['fa'].required.field)
            .bail()
            .custom((value, { req }) => {
                if (isEmailValid(value))
                    return true
                else if (isPhoneNumberValid(value))
                    return true
                throw new Error(_sr[req.lang].required.all)
            }),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const forget = await Forget.findOne({ username: req.body.username })
            const user = await User.findOne({ $or: [{ email: req.body.username }, { mobile: req.body.username }] })
            if (!user || user.mobile_email_confirmation_done)
                return res404(res, _sr[req.lang].not_found.user_id)
            if (!forget) {         // check forget for user is expired
                let code = generateRandomDigits(8)
                if (isPhoneNumberValid(req.body.username)) {
                    let message = ` رمز عبور موقت حساب شما در فروشگاه آنلاین لباس: ${code} بعد از ورود به حساب رمز عبور حساب خود را تغییر دهید. لغو 11`
                    sendSms(user.mobile, message)
                    await User.findByIdAndUpdate(user.id, { password: code })
                    await Forget.create({ username: user.mobile, password: code })
                    return res201(res, _sr[req.lang].response.activation_code)
                } else {
                    sendMail({
                        from: `"رمز عبور فروشگاه آنلاین لباس" <${process.env.MAIL_USERNAME}>`, // sender address
                        to: user.email, // list of receivers
                        subject: "رمز عبور موقت", // Subject line
                        html: `<b>رمز عبور: ${code} بعد از ورود به حساب رمز عبور حساب خود را تفییر دهید</b>`, // html body ( mail template will be here )
                    })
                    await User.findByIdAndUpdate(user.id, { password: code })
                    await Forget.create({ username: user.email, password: code })
                    return res201(res, _sr[req.lang].response.activation_email)
                }
            }
            return res403(res, _sr[req.lang].response.has_sent_activation_code)
        } catch (e) {
            console.log(e);
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

/**
    This controller would register user completely
*/
module.exports.setPassword = [
    [
        body('new_password')
            .isLength({ min: 8 }).withMessage(_sr['fa'].min_char.min8),
        body('confirm_password')
            .custom((value, { req }) => {
                if (value !== req.body.new_password)
                    throw new Error(_sr[req.lang].response.passwords_not_match)
                return true
            })
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const user = await User.findOne(req.user)
            if (!user.mobile_email_confirmation_done)
                return res403(res, _sr[req.lang].response.forbidden)

            await User.findByIdAndUpdate(user.id, { password: req.body.confirm_password, registration_done: true })
            return res200(res, _sr[req.lang].response.registered)
        } catch (e) {
            console.log(e);
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]