const { Router } = require('express')
const router = Router({ mergeParams: true })

/////////////////////////////////////////////////////////// controllers
const userController = require('../../controllers/v1/auth/userController')


/////////////////////////////////////////////////////////// middlewares
const { verifyToken } = require('../../middleware/verification')


/////////////////////////////////////////////////////////// routes
router.post('/login', userController.loginProcess)
router.post('/register', userController.normalRegisterProcess)

router.post('/verifyOtp', userController.verifyOtp)
router.post('/tryAgainOtp', userController.tryAgainOtp)

router.post('/setPassword', verifyToken(), userController.setPassword)
router.post('/forgetPassword', userController.forgetPassword)

module.exports = router
