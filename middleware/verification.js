const User = require('../models/User')
const Otp = require('../models/Otp')
const { res403, res500, res401 } = require('../helpers/statusCodes')
const { verifyJwt } = require('../helpers/genJwt')
const { sendSms } = require('../helpers/otp')
const { generateRandomDigits } = require('../helpers/controllersHelperFunctions')
const { _sr } = require('../helpers/serverResponses')

module.exports = {
    verifyToken: () => {
        return async (req, res, next) => {
            try {
                if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
                    let token = req.headers.authorization.split(' ')[1];
                    verifyJwt(token)

                    let isTokenExistInDb = await User.findOne({ token: token })
                    if (!isTokenExistInDb)
                        return res403(res, _sr[req.lang].response.unauthenticated)

                    req.user = await User.findOne({ token: token })
                    next()
                } else
                    return res403(res, _sr[req.lang].response.unauthenticated)
            } catch (e) {
                console.log(e)
                return res500(res, _sr[req.lang].response.unauthenticated)
            }
        }
    },
    isUserRegisteredDone: () => {
        return async (req, res, next) => {
            try {
                if (req.user.registration_done)
                    next()
                else
                    return res403(res, _sr[req.lang].response.unauthenticated)
            } catch (e) {
                console.log(e);
                return res500(res, _sr[req.lang].response.unauthenticated)
            }
        }
    },
    isMobileConfirmed: () => {
        return async (req, res, next) => {
            try {
                let user = null
                let otp = null
                if (req.body.username == null) {
                    user = await User.findOne({ $or: [{ email: req.user.email }, { mobile: req.user.mobile }] })
                    otp = await Otp.findOne({ $or: [{ username: req.user.email }, { username: req.user.mobile }] })
                } else {
                    user = await User.findOne({ $or: [{ email: req.body.username }, { mobile: req.body.username }] })
                    otp = await Otp.findOne({ username: req.body.username })
                }
                if (user.mobile_email_confirmation_done)
                    next()
                else {
                    if (!otp) {
                        let code = generateRandomDigits(6)
                        let message = `به فروشگاه آنلاین لباس خوش آمدید. کد فعالسازی: ${code} لغو 11`
                        sendSms(user.mobile, message)
                        await Otp.create({ username: user.mobile, code: code })
                    }
                    return res401(res, _sr[req.lang].response.verify_account)
                }
            } catch (e) {
                console.log(e);
                return res500(res, _sr[req.lang].response.problem)
            }
        }
    },
    verifyAdmin: () => {
        return async (req, res, next) => {
            try {
                if (req.user.scope.includes('admin'))
                    return next()
                return res403(res, _sr[req.lang].response.unauthenticated)
            } catch (e) {
                console.log(e)
                return res500(res, _sr[req.lang].response.unauthenticated)
            }
        }
    },
    verifyOwner: () => {
        return async (req, res, next) => {
            try {
                if (req.user.scope.includes('owner'))
                    return next()
                return res403(res, _sr[req.lang].response.unauthenticated)
            } catch (e) {
                console.log(e)
                return res500(res, _sr[req.lang].response.problem)
            }
        }
    }
}