const { Router } = require('express')
const router = Router({ mergeParams: true })

/////////////////////////////////////////////////////////// controllers
const categoryController = require('../../controllers/v1/categoryController')
const productController = require('../../controllers/v1/productController')

/////////////////////////////////////////////////////////// middlewares

/////////////////////////////////////////////////////////// routes
router.get('/getCategories', categoryController.getCategories)

router.get('/getProducts', productController.getProducts)
router.get('/getProducts/:id', productController.getProductDetail)


module.exports = router
