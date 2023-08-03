const mongoose = require('mongoose')
const Category = require('../../models/Category')
const { _sr } = require('../../helpers/serverResponses')
const { res200, res201, res404, res422, res500, checkValidations } = require('../../helpers/statusCodes')
const { body, validationResult } = require('express-validator')
const fs = require('fs')
const sharp = require('sharp')


///// variables
const iconImageQuality = 100

const limitImageMB = 2
const iconImageWidth = 500
const iconImageHeight = 500


//////////////////////////////////////////////////////////////////////////////// admin
module.exports.getCategoriesByAdmin = [
    async (req, res) => {
        try {
            const parentCategory = await Category.find({}).populate('ancestors');
            return res.json(parentCategory)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.addCategory = [
    [
        body('en_title')
            .notEmpty().withMessage(_sr['en'].required.title)
            .bail()
            .custom(value => {
                return Category.findOne({ 'locale.en.title': value })
                    .then(category => {
                        if (category) return Promise.reject(_sr['fa'].duplicated.title)
                        else return true
                    })
            }),
        body('fa_title')
            .notEmpty().withMessage(_sr['fa'].required.title)
            .bail()
            .custom(value => {
                return Category.findOne({ 'locale.fa.title': value })
                    .then(category => {
                        if (category) return Promise.reject(_sr['fa'].duplicated.title)
                        else return true
                    })
            }),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const icon = req.files?.icon
            let parent = null
            const _id = new mongoose.Types.ObjectId();

            const { en_title, fa_title, parentId, active } = req.body

            if (parentId != null) {
                if (!mongoose.isValidObjectId(parentId))
                    return res404(res, _sr[req.lang].not_found.category)
                parent = await Category.findById(parentId)
                if (!parent)
                    return res404(res, _sr[req.lang].not_found.category)
            }
            const data = {
                _id,
                locale: {
                    fa: {
                        title: fa_title,
                    },
                    en: {
                        title: en_title,
                    },
                },
                parent: parent,
                creator: req.user._id,
                active,
            }
            if (icon) {
                if (!_sr.supportedImageFormats.includes(icon.mimetype.split('/')[1])) return res.status(422).json({ validation: { icon: { msg: _sr[req.lang].format.image } } })

                ///// start convert byte to mb
                const mb = icon.size / (1024 * 1024);

                ///// check limit size of video
                if (mb > limitImageMB) return res422(res, { icon: { msg: `${_sr[req.lang].max_char.data_size} ${limitImageMB} مگابایت` } });

                const iconName = `category_${_id}_${Date.now()}.png`

                const target = sharp(icon.data)
                await target
                    .resize(iconImageWidth, iconImageHeight, { fit: 'cover' })
                    .toFormat('png')
                    .png({ quality: iconImageQuality })
                    .toFile(`./static/uploads/images/category/${iconName}`)
                    .catch(() => {
                        // for avoiding shell upload
                        return res422(res, { icon: { msg: _sr[req.lang].format.image } })
                    })

                data.icon = iconName
            }

            await Category.create(data)
            return res201(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.updateCategory = [
    [
        body('en_title')
            .notEmpty().withMessage(_sr['en'].required.title)
            .bail()
            .custom((value, { req }) => {
                return Category.findOne({ 'locale.en.title': value })
                    .then(category => {
                        if (category && req.params.id != category._id) return Promise.reject(_sr['en'].duplicated.title)
                        else return true
                    })
            }),
        body('fa_title')
            .notEmpty().withMessage(_sr['fa'].required.title)
            .bail()
            .custom((value, { req }) => {
                return Category.findOne({ 'locale.fa.title': value })
                    .then(category => {
                        if (category && req.params.id != category._id) return Promise.reject(_sr['fa'].duplicated.title)
                        else return true
                    })
            })
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            let acceptImage = false
            const icon = req?.files?.icon
            const targetCategory = await Category.findById(req?.params?.id)
            let parent = null

            const { en_title, fa_title, parentId, active } = req.body

            const data = {
                locale: {
                    fa: {
                        title: fa_title,
                    },
                    en: {
                        title: en_title,
                    },
                },
                creator: req.user._id,
                active,
            }
            if (parentId != null) {
                if (!mongoose.isValidObjectId(parentId))
                    return res404(res, _sr[req.lang].not_found.category)
                if (targetCategory._id == parentId)
                    return res422(res, _sr[req.lang].response.repetitiveParentCategory)
                const nested = await Category.findOne({ parent: targetCategory._id })
                if (nested)
                    return res422(res, _sr[req.lang].response.nestedError)
                parent = await Category.findById(parentId)
                data.parent = parent
                if (!parent)
                    return res404(res, _sr[req.lang].not_found.category)
            }
            console.log(targetCategory.ancestors.length);
            /////// check validation for image
            if (icon) {
                if (!_sr.supportedImageFormats.includes(icon.mimetype.split('/')[1])) return res422(res, { icon: { msg: _sr[req.lang].format.image } })
                ///// start convert byte to mb
                const mb = icon.size / (1024 * 1024);
                ///// check limit size of video
                if (mb > limitImageMB) {
                    return res422(res, { icon: { msg: `${_sr[req.lang].max_char.data_size} ${limitImageMB} مگابایت` } });
                }
                acceptImage = true
            }
            /////// upload image
            if (acceptImage) {
                const iconName = `category_${targetCategory.id}_${Date.now()}.jpeg`

                if (targetCategory?.icon && await fs.existsSync(`./static/${targetCategory?.icon}`)) {
                    await fs.unlinkSync(`./static/${targetCategory?.icon}`)
                }

                const target = await sharp(icon.data)
                await target
                    .resize(iconImageWidth, iconImageHeight, { fit: 'cover' })
                    .toFormat('png')
                    .png({ quality: iconImageQuality })
                    .toFile(`./static/uploads/images/category/${iconName}`)
                    .catch(() => {
                        // for avoiding shell upload
                        return res422(res, { icon: { msg: _sr[req.lang].format.image } })
                    })

                data.icon = iconName
            }

            await Category.findOneAndUpdate({ _id: targetCategory.id }, data)
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.deleteCategory = [
    async (req, res) => {
        try {
            const id = req?.params?.id
            if (!mongoose.isValidObjectId(id)) return res404(res, _sr[req.lang].not_found.news)

            const targetCategory = await Category.findById(id)
            const allCategory = await Category.find({})
            if (!targetCategory)
                return res404(res, _sr[req.lang].not_found.category)

            allCategory.forEach((category, index) => {
                if (category.parent == id)
                    return res422(res, _sr[req.lang].response.nestedError)
            })

            if (targetCategory.icon) {
                fs.unlink(`./static/${targetCategory.icon}`, err => {
                    if (err) console.log(err)
                })
            }
            await Category.findOneAndDelete(id)
            return res200(res, _sr[req.lang].response.success_remove)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

//////////////////////////////////////////////////////////////////////////////// public
module.exports.getCategories = [
    async (req, res) => {
        try {
            const parentCategory = await Category.find({ active: true }).populate('ancestors');
            return res.json(parentCategory)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]