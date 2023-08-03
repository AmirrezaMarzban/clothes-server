const { Router } = require('express')
const router = Router({ mergeParams: true })

/////////////////////////////////////////////////////////// controllers
const adminController = require('../../controllers/v1/adminController')
const categoryController = require('../../controllers/v1/categoryController')
const ticketController = require('../../controllers/v1/ticketController')
const productController = require('../../controllers/v1/productController')
const commentController = require('../../controllers/v1/commentController')

/////////////////////////////////////////////////////////// middlewares
const { verifyToken, verifyAdmin } = require('../../middleware/verification')

/////////////////////////////////////////////////////////// routes
router.get('/getUsers', [verifyToken(), verifyAdmin()], adminController.getUsersList)
router.get('/updateUser/:id', [verifyToken(), verifyAdmin()], adminController.updateUserInfo)
router.delete('/deleteUser/:id', [verifyToken(), verifyAdmin()], adminController.deleteUser)

router.get('/getCategories', [verifyToken(), verifyAdmin()], categoryController.getCategoriesByAdmin)
router.post('/addCategory', [verifyToken(), verifyAdmin()], categoryController.addCategory)
router.patch('/updateCategory/:id', [verifyToken(), verifyAdmin()], categoryController.updateCategory)
router.delete('/deleteCategory/:id', [verifyToken(), verifyAdmin()], categoryController.deleteCategory)

router.get('/getTickets', [verifyToken(), verifyAdmin()], ticketController.getTicketsByAdmin)
router.get('/getTickets/:ticketNumber', [verifyToken(), verifyAdmin()], ticketController.getTicketsDetailByAdmin)
router.post('/replyTicket', [verifyToken(), verifyAdmin()], ticketController.replyTicketByAdmin)
router.patch('/changeTicketStatus', [verifyToken(), verifyAdmin()], ticketController.changeStatusByAdmin)

router.patch('/changeTicketStatus', [verifyToken(), verifyAdmin()], ticketController.changeStatusByAdmin)

router.get('/getProducts', [verifyToken(), verifyAdmin()], productController.getProductsByAdmin)
router.get('/getProducts/:id', [verifyToken(), verifyAdmin()], productController.getProductDetailByAdmin)
router.get('/changeProductStatus/:id', [verifyToken(), verifyAdmin()], productController.changeProductStatusByAdmin)
router.get('/getDeletedRequestsProducts', [verifyToken(), verifyAdmin()], productController.getDeletedRequestsProductsByAdmin)
router.post('/createProduct', [verifyToken(), verifyAdmin()], productController.createProduct)
router.patch('/updateProduct/:id', [verifyToken(), verifyAdmin()], productController.updateProduct)
router.delete('/deleteProduct/:id', [verifyToken(), verifyAdmin()], productController.deleteProduct)

router.get('/getComments', [verifyToken(), verifyAdmin()], commentController.getCommentsByAdmin)
router.get('/getComments/:id', [verifyToken(), verifyAdmin()], commentController.getCommentDetailByAdmin)
router.patch('/updateComment/:id', [verifyToken(), verifyAdmin()], commentController.updateCommentByAdmin)
router.delete('/deleteComment/:id', [verifyToken(), verifyAdmin()], commentController.deleteCommentByAdmin)
router.patch('/approveComment/:id', [verifyToken(), verifyAdmin()], commentController.approveCommentByAdmin)


module.exports = router
