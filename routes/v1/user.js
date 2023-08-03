const { Router } = require('express')
const router = Router({ mergeParams: true })

/////////////////////////////////////////////////////////// controllers
const userController = require('../../controllers/v1/userController')
const ticketController = require('../../controllers/v1/ticketController')
const commentController = require('../../controllers/v1/commentController')

/////////////////////////////////////////////////////////// middlewares
const { verifyToken, isUserRegisteredDone, isMobileConfirmed } = require('../../middleware/verification')

/////////////////////////////////////////////////////////// routes
router.get('/logout', [verifyToken(), isUserRegisteredDone()], userController.logout)
router.patch('/updateProfileInfo', [verifyToken(), isUserRegisteredDone()], userController.updateProfileInfo)
router.patch('/updatePassword', [verifyToken(), isUserRegisteredDone(), isMobileConfirmed()], userController.updatePassword)
router.patch('/addProfilePic', [verifyToken(), isUserRegisteredDone(), isMobileConfirmed()], userController.addProfilePic)

router.post('/createTicket', [verifyToken(), isUserRegisteredDone(), isMobileConfirmed()], ticketController.createTicket)
router.get('/getTickets', [verifyToken(), isUserRegisteredDone(), isMobileConfirmed()], ticketController.getTickets)
router.get('/getTicket/:ticketNumber', [verifyToken(), isUserRegisteredDone(), isMobileConfirmed()], ticketController.getTicketsDetail)
router.post('/replyTicket', [verifyToken(), isUserRegisteredDone(), isMobileConfirmed()], ticketController.replyTicket)
router.post('/closeTicket', [verifyToken(), isUserRegisteredDone(), isMobileConfirmed()], ticketController.closeTicket)

router.post('/postComment', [verifyToken(), isUserRegisteredDone(), isMobileConfirmed()], commentController.postComment)
router.get('/getComments', [verifyToken(), isUserRegisteredDone(), isMobileConfirmed()], commentController.getComments)
router.delete('/deleteComment/:id', [verifyToken(), isUserRegisteredDone(), isMobileConfirmed()], commentController.deleteComment)


module.exports = router