const mongoose = require('mongoose')
const Comment = require('../../models/Comment')
const Product = require('../../models/Product')
const { _sr } = require('../../helpers/serverResponses')
const { res200, res201, res404, res422, res500, checkValidations } = require('../../helpers/statusCodes')
const { body, validationResult } = require('express-validator')
const fs = require('fs')
const sharp = require('sharp')


///// variables
const productImageQuality = 100

const productThumbImageWidth = 200
const productThumbImageHeight = 200
const productThumbImageQuality = 80

const limitImageMB = 2
const productImageWidth = 300
const productImageHeight = 300

const limit = 12
const productsRelatedLimit = 5

//////////////////////////////////////////////////////////////////////////////// admin
module.exports.getProductsByAdmin = [
    async (req, res) => {
        try {
            const productList = await Product.paginate({}, {
                page: req?.query?.page,
                limit,
                populate: [
                    { path: 'owner', select: 'firstName lastName' },
                    { path: 'store', select: 'locale thumbnail' }
                ],
                sort: {
                    created_at: 'desc'
                },
            })
            return res.json(productList)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.getDeletedRequestsProductsByAdmin = [
    async (req, res) => {
        try {
            const productList = await Product.paginate({ deleted_request: true }, {
                page: req?.query?.page,
                limit,
                populate: [
                    { path: 'owner', select: 'firstName lastName' },
                    { path: 'store', select: 'locale thumbnail' }
                ],
                sort: {
                    created_at: 'desc'
                }
            })
            return res.json(productList)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.getProductDetailByAdmin = [
    async (req, res) => {
        try {
            const product = await Product.findById(req?.params?.id)
                .populate('owner', 'firstName lastName')
                .populate('store', 'locale')
                .populate('category', 'locale')
            if (!product)
                return res404(res, _sr[req.lang].not_found.product)

            return res.json(product)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.changeProductStatusByAdmin = [
    async (req, res) => {
        try {
            const product = await Product.findById(req?.params?.id)
            if (!product) return res404(res, _sr[req.lang].not_found.product)

            product.active = !product.active;
            await product.save();

            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.createProduct = [
    [
        body('en_name')
            .notEmpty().withMessage(_sr['en'].required.name),
        body('en_description')
            .notEmpty().withMessage(_sr['en'].required.description),
        body('fa_name')
            .notEmpty().withMessage(_sr['en'].required.name),
        body('fa_description')
            .notEmpty().withMessage(_sr['fa'].required.description),
        body('category')
            .notEmpty().withMessage(_sr['fa'].required.category),
        body('owner')
            .notEmpty().withMessage(_sr['fa'].required.user_id),
        body('store')
            .notEmpty().withMessage(_sr['fa'].required.brands),
        body('prices')
            .notEmpty().withMessage(_sr['fa'].required.price)
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const _id = new mongoose.Types.ObjectId();

            const { en_name, en_description, fa_name, fa_description, owner, store, available, prices, category, en_meta_tag, en_meta_description, fa_meta_tag, fa_meta_description, active } = req.body
            const data = {
                _id,
                locale: {
                    fa: {
                        name: fa_name,
                        description: fa_description,
                        meta_tag: fa_meta_tag,
                        meta_description: fa_meta_description
                    },
                    en: {
                        name: en_name,
                        description: en_description,
                        meta_tag: en_meta_tag,
                        meta_description: en_meta_description
                    }
                },
                prices,
                owner,
                store,
                available,
                category,
                active
            }

            await Product.create(data)
            return res201(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.updateProduct = [
    [
        body('en_name')
            .notEmpty().withMessage(_sr['en'].required.name),
        body('en_description')
            .notEmpty().withMessage(_sr['en'].required.description),
        body('fa_name')
            .notEmpty().withMessage(_sr['en'].required.name),
        body('fa_description')
            .notEmpty().withMessage(_sr['fa'].required.description),
        body('category')
            .notEmpty().withMessage(_sr['fa'].required.category),
        body('owner')
            .notEmpty().withMessage(_sr['fa'].required.user_id),
        body('store')
            .notEmpty().withMessage(_sr['fa'].required.brands),
        body('prices')
            .notEmpty().withMessage(_sr['fa'].required.price)
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            let acceptThumb = false
            let acceptImage = false
            const id = req?.params?.id
            const targetProduct = await Product.findById(id)
            if (!targetProduct)
                return res404(res, _sr[req.lang].not_found.product)

            const thumb = req?.files?.thumb
            const slides = req?.files?.images

            const { en_name, en_description, fa_name, fa_description, owner, store, available, prices, en_meta_tag, en_meta_description, fa_meta_tag, fa_meta_description } = req.body
            const data = {
                locale: {
                    fa: {
                        name: fa_name,
                        description: fa_description,
                        meta_tag: fa_meta_tag,
                        meta_description: fa_meta_description
                    },
                    en: {
                        name: en_name,
                        description: en_description,
                        meta_tag: en_meta_tag,
                        meta_description: en_meta_description
                    }
                },
                prices,
                owner,
                store,
                available
            }
            /////// check validation for image
            if (slides) {
                if (Array.isArray(slides)) {
                    slides.forEach((slide, index) => {
                        if (!_sr.supportedImageFormats.includes(slide.mimetype.split('/')[1])) return res422(res, { image: { msg: _sr[req.lang].format.image } })
                        ///// start convert byte to mb
                        const mb = slide.size / (1024 * 1024);
                        ///// check limit size of image
                        if (mb > limitImageMB) {
                            return res422(res, { image: { msg: `${_sr[req.lang].max_char.data_size} ${limitImageMB} مگابایت` } });
                        }
                    })
                } else {
                    if (!_sr.supportedImageFormats.includes(slides.mimetype.split('/')[1])) return res422(res, { image: { msg: _sr[req.lang].format.image } })
                    ///// start convert byte to mb
                    const mb = slides.size / (1024 * 1024);
                    ///// check limit size of image
                    if (mb > limitImageMB) {
                        return res422(res, { image: { msg: `${_sr[req.lang].max_char.data_size} ${limitImageMB} مگابایت` } });
                    }
                }
                acceptImage = true
            }

            if (thumb) {
                if (!_sr.supportedImageFormats.includes(thumb.mimetype.split('/')[1])) return res422(res, { image: { msg: _sr[req.lang].format.image } })
                ///// start convert byte to mb
                const mb = thumb.size / (1024 * 1024);
                ///// check limit size of video
                if (mb > limitImageMB) {
                    return res422(res, { image: { msg: `${_sr[req.lang].max_char.data_size} ${limitImageMB} مگابایت` } });
                }
                acceptThumb = true
            }

            /////// upload image and thumbnail
            if (acceptImage) {
                let imageName = null
                let images = []

                if (Array.isArray(slides)) {
                    for (let i = 0; i < slides.length; i++) {
                        imageName = `product_${id}_${Date.now()}_${i + 1}.jpeg`
                        const target = await sharp(slides[i].data)
                        await target
                            .resize(productImageWidth, productImageHeight, { fit: 'cover' })
                            .toFormat('jpeg')
                            .jpeg({ quality: productImageQuality })
                            .toFile(`./static/uploads/images/product/${imageName}`)
                            .catch(() => {
                                // for avoiding shell upload
                                return res422(res, { image: { msg: _sr[req.lang].format.image } })
                            })
                        images.push(imageName)
                    }
                } else {
                    imageName = `product_${id}_${Date.now()}.jpeg`
                    const target = await sharp(slides.data)
                    await target
                        .resize(productImageWidth, productImageHeight, { fit: 'cover' })
                        .toFormat('jpeg')
                        .jpeg({ quality: productImageQuality })
                        .toFile(`./static/uploads/images/product/${imageName}`)
                        .catch(() => {
                            // for avoiding shell upload
                            return res422(res, { image: { msg: _sr[req.lang].format.image } })
                        })
                    images.push(imageName)
                }

                data.images = images
            }

            if (acceptThumb) {
                const imageName = `product_${id}_${Date.now()}.jpeg`
                const thumbnail = `thumb_${imageName}`

                if (targetProduct?.thumbnail && await fs.existsSync(`./static/${targetProduct?.thumbnail}`)) {
                    await fs.unlinkSync(`./static/${targetProduct?.thumbnail}`)
                }

                const target = await sharp(thumb.data)
                await target
                    .resize(productThumbImageWidth, productThumbImageHeight, { fit: 'cover' })
                    .toFormat('jpeg')
                    .jpeg({ quality: productThumbImageQuality })
                    .toFile(`./static/uploads/images/product/thumb/${thumbnail}`)
                    .catch(() => {
                        // for avoiding shell upload
                        return res422(res, { image: { msg: _sr[req.lang].format.image } })
                    })

                data.thumbnail = thumbnail
            }

            await Product.findOneAndUpdate(id, data)
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.deleteProduct = [
    async (req, res) => {
        try {
            const id = req?.params?.id
            if (!mongoose.isValidObjectId(id)) return res404(res, _sr[req.lang].not_found.product)

            const targetProduct = await Product.findById(id)
            if (!targetProduct)
                return res404(res, _sr[req.lang].not_found.product)

            if (targetProduct?.images) {
                targetProduct.images.forEach((image, index) => {
                    fs.unlink(`./static/${image}`, err => {
                        if (err) console.log(err)
                    })
                })
            }
            if (targetProduct?.thumbnail) {
                fs.unlink(`./static/${targetProduct.thumbnail}`, err => {
                    if (err) console.log(err)
                })
            }
            await Product.findOneAndDelete(id)
            return res200(res, _sr[req.lang].response.success_remove)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

//////////////////////////////////////////////////////////////////////////////// public
module.exports.getProductDetail = [
    async (req, res) => {
        try {
            const id = req?.params?.id
            if (!mongoose.isValidObjectId(id)) return res404(res, _sr[req.lang].not_found.product)
            const product = await Product.findOne({ _id: id, active: true, deleted_request: false })
                .populate('owner', 'firstName lastName profilepic')
                .populate('category', 'locale')
                .populate('store', 'locale')
            const requests = [
                product,
                Product.find({ category: product?.category, active: true, _id: { $ne: id } })
                    .limit(productsRelatedLimit)
                    .select('locale thumbnail prices'),
                Comment.paginate({ active: true, product: product.id }, {
                    page: req?.query?.page,
                    limit,
                    populate: [
                        { path: 'author', select: 'firstName lastName' },
                        { path: 'product', select: 'locale thumbnail' }
                    ],
                    sort: {
                        created_at: 'desc'
                    }
                })
            ]

            let fetch = await Promise.all(requests)
            const [details, relatedProducts, comment] = fetch

            if (!details)
                return res404(res, _sr[req.lang].not_found.product)

            return res.json({
                detail: details,
                related_products: relatedProducts,
                comments: comment
            })
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.getProducts = [
    async (req, res) => {
        try {
            const products = await Product.paginate({ active: true, deleted_request: false }, {
                page: req?.query?.page,
                limit,
                sort: {
                    created_at: 'desc'
                },
                select: 'locale prices thumbnail'
            })

            return res.json(products)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]
//////////////////////////////////////////////////////////////////////////////// user
module.exports.myProducts = [
    async (req, res) => {
        try {
            const products = await Product.paginate({ owner: req.user.id }, {
                page: req?.query?.page,
                limit,
                sort: {
                    created_at: 'desc'
                },
                select: 'locale prices thumbnail'
            })

            return res.json(products)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.myProductsDetail = [
    async (req, res) => {
        try {
            const id = req?.params?.id
            if (!mongoose.isValidObjectId(id)) return res404(res, _sr[req.lang].not_found.product)
            const products = await Product.findById(id)
            if (products.owner != req.user.id) return res404(res, _sr[req.lang].not_found.product)

            return res.json(products)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.createProductByUser = [
    [
        body('en_name')
            .notEmpty().withMessage(_sr['en'].required.name),
        body('en_description')
            .notEmpty().withMessage(_sr['en'].required.description),
        body('fa_name')
            .notEmpty().withMessage(_sr['en'].required.name),
        body('fa_description')
            .notEmpty().withMessage(_sr['fa'].required.description),
        body('category')
            .notEmpty().withMessage(_sr['fa'].required.category),
        body('owner')
            .notEmpty().withMessage(_sr['fa'].required.user_id),
        body('store')
            .notEmpty().withMessage(_sr['fa'].required.brands),
        body('prices')
            .notEmpty().withMessage(_sr['fa'].required.price)
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const _id = new mongoose.Types.ObjectId();

            const { en_name, en_description, fa_name, fa_description, owner, available, store, prices, category, en_meta_tag, en_meta_description, fa_meta_tag, fa_meta_description } = req.body
            const data = {
                _id,
                locale: {
                    fa: {
                        name: fa_name,
                        description: fa_description,
                        meta_tag: fa_meta_tag,
                        meta_description: fa_meta_description
                    },
                    en: {
                        name: en_name,
                        description: en_description,
                        meta_tag: en_meta_tag,
                        meta_description: en_meta_description
                    }
                },
                prices,
                owner,
                store,
                category,
                available
            }

            await Product.create(data)
            return res201(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.editProductByUser = [
    [
        body('en_name')
            .notEmpty().withMessage(_sr['en'].required.name),
        body('en_description')
            .notEmpty().withMessage(_sr['en'].required.description),
        body('fa_name')
            .notEmpty().withMessage(_sr['en'].required.name),
        body('fa_description')
            .notEmpty().withMessage(_sr['fa'].required.description),
        body('category')
            .notEmpty().withMessage(_sr['fa'].required.category),
        body('owner')
            .notEmpty().withMessage(_sr['fa'].required.user_id),
        body('store')
            .notEmpty().withMessage(_sr['fa'].required.brands),
        body('prices')
            .notEmpty().withMessage(_sr['fa'].required.price)
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            let acceptThumb = false
            let acceptImage = false
            const id = req?.params?.id
            const targetProduct = await Product.findById(id)
            if (!targetProduct)
                return res404(res, _sr[req.lang].not_found.product)

            const thumb = req?.files?.thumb
            const slides = req?.files?.images

            const { en_name, en_description, fa_name, fa_description, owner, available, store, prices, en_meta_tag, en_meta_description, fa_meta_tag, fa_meta_description } = req.body
            const data = {
                locale: {
                    fa: {
                        name: fa_name,
                        description: fa_description,
                        meta_tag: fa_meta_tag,
                        meta_description: fa_meta_description
                    },
                    en: {
                        name: en_name,
                        description: en_description,
                        meta_tag: en_meta_tag,
                        meta_description: en_meta_description
                    }
                },
                prices,
                owner,
                store,
                available
            }
            /////// check validation for image
            if (slides) {
                if (Array.isArray(slides)) {
                    slides.forEach((slide, index) => {
                        if (!_sr.supportedImageFormats.includes(slide.mimetype.split('/')[1])) return res422(res, { image: { msg: _sr[req.lang].format.image } })
                        ///// start convert byte to mb
                        const mb = slide.size / (1024 * 1024);
                        ///// check limit size of image
                        if (mb > limitImageMB) {
                            return res422(res, { image: { msg: `${_sr[req.lang].max_char.data_size} ${limitImageMB} مگابایت` } });
                        }
                    })
                } else {
                    if (!_sr.supportedImageFormats.includes(slides.mimetype.split('/')[1])) return res422(res, { image: { msg: _sr[req.lang].format.image } })
                    ///// start convert byte to mb
                    const mb = slides.size / (1024 * 1024);
                    ///// check limit size of image
                    if (mb > limitImageMB) {
                        return res422(res, { image: { msg: `${_sr[req.lang].max_char.data_size} ${limitImageMB} مگابایت` } });
                    }
                }
                acceptImage = true
            }

            if (thumb) {
                if (!_sr.supportedImageFormats.includes(thumb.mimetype.split('/')[1])) return res422(res, { image: { msg: _sr[req.lang].format.image } })
                ///// start convert byte to mb
                const mb = thumb.size / (1024 * 1024);
                ///// check limit size of video
                if (mb > limitImageMB) {
                    return res422(res, { image: { msg: `${_sr[req.lang].max_char.data_size} ${limitImageMB} مگابایت` } });
                }
                acceptThumb = true
            }

            /////// upload image and thumbnail
            if (acceptImage) {
                let imageName = null
                let images = []

                if (Array.isArray(slides)) {
                    for (let i = 0; i < slides.length; i++) {
                        imageName = `product_${id}_${Date.now()}_${i + 1}.jpeg`
                        const target = await sharp(slides[i].data)
                        await target
                            .resize(productImageWidth, productImageHeight, { fit: 'cover' })
                            .toFormat('jpeg')
                            .jpeg({ quality: productImageQuality })
                            .toFile(`./static/uploads/images/product/${imageName}`)
                            .catch(() => {
                                // for avoiding shell upload
                                return res422(res, { image: { msg: _sr[req.lang].format.image } })
                            })
                        images.push(imageName)
                    }
                } else {
                    imageName = `product_${id}_${Date.now()}.jpeg`
                    const target = await sharp(slides.data)
                    await target
                        .resize(productImageWidth, productImageHeight, { fit: 'cover' })
                        .toFormat('jpeg')
                        .jpeg({ quality: productImageQuality })
                        .toFile(`./static/uploads/images/product/${imageName}`)
                        .catch(() => {
                            // for avoiding shell upload
                            return res422(res, { image: { msg: _sr[req.lang].format.image } })
                        })
                    images.push(imageName)
                }

                data.images = images
            }

            if (acceptThumb) {
                const imageName = `product_${id}_${Date.now()}.jpeg`
                const thumbnail = `thumb_${imageName}`

                if (targetProduct?.thumbnail && await fs.existsSync(`./static/${targetProduct?.thumbnail}`)) {
                    await fs.unlinkSync(`./static/${targetProduct?.thumbnail}`)
                }

                const target = await sharp(thumb.data)
                await target
                    .resize(productThumbImageWidth, productThumbImageHeight, { fit: 'cover' })
                    .toFormat('jpeg')
                    .jpeg({ quality: productThumbImageQuality })
                    .toFile(`./static/uploads/images/product/thumb/${thumbnail}`)
                    .catch(() => {
                        // for avoiding shell upload
                        return res422(res, { image: { msg: _sr[req.lang].format.image } })
                    })

                data.thumbnail = thumbnail
            }

            await Product.findOneAndUpdate(id, data)
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.deleteProductByUser = [
    async (req, res) => {
        try {
            const id = req?.params?.id
            if (!mongoose.isValidObjectId(id)) return res404(res, _sr[req.lang].not_found.product)

            const targetProduct = await Product.findById(id)
            if (!targetProduct)
                return res404(res, _sr[req.lang].not_found.product)

            targetProduct.deleted_request = true
            await targetProduct.save()
            return res200(res, _sr[req.lang].response.deleted_request)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]