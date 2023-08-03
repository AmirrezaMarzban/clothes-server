const { Router } = require('express')
const router = Router({ mergeParams: true })

// Require & Import API routes v1
const public = require('./public')
const admin = require('./admin')
const auth = require('./auth')
const user = require('./user')

// Use API Routes v1
router.use('/public', public)
router.use('/auth', auth)
router.use('/admin', admin)
router.use('/user', user)


module.exports = router
