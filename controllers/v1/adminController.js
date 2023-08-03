const mongoose = require('mongoose')
const User = require('../../models/User')
const { body, validationResult } = require('express-validator')
const { _sr } = require('../../helpers/serverResponses')
const fs = require('fs')
const sharp = require('sharp')
const { iranCities } = require('../../helpers/countries')
const { res200, res404, res500, checkValidations } = require('../../helpers/statusCodes')
const { isPhoneNumberValid, checkNationalCode } = require('../../helpers/controllersHelperFunctions')
const { sendSms } = require('../../helpers/otp')

const limit = 5

module.exports.getUsersList = [
    async (req, res) => {
        try {
            const usersList = await User.paginate({}, {
                page: req?.query?.page,
                limit,
                sort: {
                    created_at: 'desc'
                }
            });
            return res.json(usersList)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.updateUserInfo = [
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
            const id = req?.params?.id
            if (!mongoose.isValidObjectId(id)) return res404(res, _sr[req.lang].not_found.user_id)

            const targetUser = await User.findById(id)
            if (!targetUser)
                return res404(res, _sr[req.lang].not_found.user_id)

            let { scope, firstName, lastName, email, mobile, nationalCode, province, city, address, birthdate, gender, active } = req.body
            const newUserInfo = {
                scope: scope,  // default is user
                firstName: firstName,
                lastName: lastName,
                email: email,
                mobile: mobile,
                nationalCode: nationalCode,
                province: province,
                city: city,
                active: active,
                address: address,
                birthDate: Date.now(), // this is temporary
                gender: gender
            }
            if (active) {
                let message = `${firstName} ${lastName} عزیز حساب فروشنده شما به شماره تایید شد اکنون میتوانید وارد شوید`
                sendSms(mobile, message)
            }
            await User.findByIdAndUpdate(id, newUserInfo)
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.deleteUser = [
    async (req, res) => {
        try {
            const id = req?.params?.id
            if (!mongoose.isValidObjectId(id)) return res404(res, _sr[req.lang].not_found.user_id)

            const targetUser = await User.findById(id)
            if (!targetUser)
                return res404(res, _sr[req.lang].not_found.user_id)            

            if (targetUser?.profilepic) {
                fs.unlink(`./static/${targetUser.profilepic}`, err => {
                    if (err) console.log(err)
                })
            }
            if (targetUser?.id_images) {
                targetUser.id_images.forEach((image, index) => {
                    fs.unlink(`./static/${image}`, err => {
                        if (err) console.log(err)
                    })
                })
            }
            await User.findOneAndDelete(id)
            return res200(res, _sr[req.lang].response.success_remove)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]