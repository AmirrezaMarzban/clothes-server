const User = require('../../models/User')
const Otp = require('../../models/Otp')
const bcrypt = require('bcrypt')
const { param, body, validationResult } = require('express-validator')
const { _sr } = require('../../helpers/serverResponses')
const fs = require('fs')
const sharp = require('sharp')
const { sendMail, sendSms } = require('../../helpers/otp')
const { iranCities } = require('../../helpers/countries')
const { res200, res201, res401, res403, res404, res422, res500, checkValidations } = require('../../helpers/statusCodes')
const { isPhoneNumberValid, checkNationalCode, generateRandomDigits } = require('../../helpers/controllersHelperFunctions')

const userImageWidth = 500
const userImageHeight = 500

const userImageQuality = 100
const limitImageMB = 2

module.exports.logout = [
    async (req, res) => {
        try {
            await User.findByIdAndUpdate(req.user.id, { token: null })
            return res200(res, _sr[req.lang].response.logged_out)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.updateProfileInfo = [
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
            .custom(value => {
                return User.findOne({ email: value })
                    .then(user => {
                        if (user && user.email != value) return Promise.reject(_sr['fa'].duplicated.email)
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
                        if (user && user.mobile != value) return Promise.reject(_sr[req.lang].duplicated.phone_number)
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
                        if (user && user.nationalCode != value) return Promise.reject(_sr[req.lang].duplicated.national_code)
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
                throw new Error(_sr[req.lang].required.province)
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
                throw new Error(_sr[req.lang].required.city)
            }),
        body('address')
            .isLength({ min: 10 }).withMessage(_sr['fa'].min_char.min10),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            let { firstName, lastName, email, mobile, nationalCode, province, city, address, birthdate, gender } = req.body
            const newUserInfo = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                // mobile: mobile,
                nationalCode: nationalCode,
                province: province,
                city: city,
                address: address,
                birthDate: Date.now(), // this is temporary
                gender: gender
            }
            if (req.user.mobile != mobile) {
                // means user changed it
                const otp = await Otp.findOne({ $or: [{ email: email }, { mobile: mobile }] })
                if (otp)
                    return res403(res, _sr[req.lang].response.has_sent_activation_code)
                await User.findByIdAndUpdate(req.user.id, { mobile_email_confirmation_done: false })
                let code = generateRandomDigits(6)
                let message = `کد فعالسازی فروشگاه آنلاین لباس: ${code} لغو 11`
                //sendSms(mobile, message)
                await User.findByIdAndUpdate(req.user.id, newUserInfo)
                await Otp.create({ username: mobile, code: code })
                return res201(res, _sr[req.lang].response.activation_code)
            }
            newUserInfo.mobile = mobile
            await User.findByIdAndUpdate(req.user.id, newUserInfo)
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.updatePassword = [
    [
        body('current_password')
            .notEmpty().withMessage(_sr['fa'].required.password)
            .bail()
            .custom(async (value, { req }) => {
                const user = await User.findOne(req.user);
                if (!user) {
                    throw new Error(_sr[req.lang].not_found.current_password);
                }
                if (!user.comparePassword || typeof user.comparePassword !== 'function') {
                    throw new Error('comparePassword method is missing or not a function');
                }
                if (user.comparePassword.bind(user)(value)) {
                    throw new Error(_sr[req.lang].not_found.current_password);
                }
                return true
            }),
        body('new_password')
            .isLength({ min: 8 }).withMessage(_sr['fa'].min_char.min8),
        body('confirm_password')
            .custom((value, { req }) => {
                if (value !== req.body.new_password)
                    throw new Error(_sr[req.lang].response.passwords_not_match)
                return true
            }),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            let { new_password } = req.body
            await User.findByIdAndUpdate(req.user.id, { password: new_password })
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.addProfilePic = [
    async (req, res) => {
        try {
            let acceptImage = false
            const image = req?.files?.image
            const targetUser = await User.findById(req.user.id)
            /////// check validation for image
            if (image) {
                if (!_sr.supportedImageFormats.includes(image.mimetype.split('/')[1])) return res422(res, { image: { msg: _sr[req.lang].format.image } })
                ///// start convert byte to mb
                const mb = image.size / (1024 * 1024);
                ///// check limit size of video
                if (mb > limitImageMB) {
                    return res422(res, { image: { msg: `${_sr[req.lang].max_char.data_size} ${limitImageMB} مگابایت` } });
                }
                acceptImage = true
            }
            /////// upload image
            if (acceptImage) {
                const imageName = `user_${Math.floor(10000 + Math.random() * 90000)}${Date.now()}.jpeg`
                if (targetUser?.profilepic && await fs.existsSync(`./static/uploads/images/user/${targetUser?.profilepic}`)) {
                    await fs.unlinkSync(`./static/uploads/images/user/${targetUser?.profilepic}`)
                }

                const target = await sharp(image.data)
                await target
                    .resize(userImageWidth, userImageHeight, { fit: 'cover' })
                    .toFormat('jpeg')
                    .jpeg({ quality: userImageQuality })
                    .toFile(`./static/uploads/images/user/${imageName}`)
                    .catch(err => {
                        // for avoiding shell upload
                        return res422(res, { image: { msg: _sr[req.lang].format.image } })
                    })

                await User.findByIdAndUpdate(req.user.id, { profilepic: imageName })
            }
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]