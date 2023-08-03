const mongoose = require('mongoose')
const Comment = require('../../models/Comment')
const { _sr } = require('../../helpers/serverResponses')
const { res200, res201, res404, res403, res422, res500, checkValidations } = require('../../helpers/statusCodes')
const { body, validationResult } = require('express-validator')
const Product = require('../../models/Product')

///// variables
const limit = 12


//////////////////////////////////////////////////////////////////////////////// admin
module.exports.getCommentsByAdmin = [
    async (req, res) => {
        try {
            const commentList = await Comment.paginate({}, {
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
            return res.json(commentList)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.getCommentDetailByAdmin = [
    async (req, res) => {
        try {
            const comment = await Comment.findById(req?.params?.id)
                .populate('author', 'firstName lastName')
                .populate('product', 'locale thumbnail')
            if (!comment)
                return res404(res, _sr[req.lang].not_found.comment)

            return res.json(comment)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.updateCommentByAdmin = [
    [
        body('text')
            .notEmpty().withMessage(_sr['fa'].required.caption),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const id = req?.params?.id
            const targetComment = await Comment.findById(id)
            if (!targetComment)
                return res404(res, _sr[req.lang].not_found.comment)

            const { text, active } = req.body
            const data = {
                text,
                active
            }

            await Comment.findOneAndUpdate(id, data)
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.deleteCommentByAdmin = [
    async (req, res) => {
        try {
            const id = req?.params?.id
            if (!mongoose.isValidObjectId(id)) return res404(res, _sr[req.lang].not_found.comment)

            const targetComment = await Comment.findById(id)
            if (!targetComment)
                return res404(res, _sr[req.lang].not_found.comment)

            await Comment.findOneAndDelete(id)
            return res200(res, _sr[req.lang].response.success_remove)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.approveCommentByAdmin = [
    async (req, res) => {
        try {
            const id = req?.params?.id
            if (!mongoose.isValidObjectId(id)) return res404(res, _sr[req.lang].not_found.comment)

            const targetComment = await Comment.findById(id)
            if (!targetComment)
                return res404(res, _sr[req.lang].not_found.comment)

            await Comment.findByIdAndUpdate(id, { active: !targetComment.active })
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

//////////////////////////////////////////////////////////////////////////////// user
module.exports.getComments = [
    async (req, res) => {
        try {
            const commentList = await Comment.paginate({ author: req.user.id }, {
                page: req?.query?.page,
                limit,
                populate: [
                    { path: 'author', select: 'firstName lastName' },
                    { path: 'product', select: 'locale thumbnail' }
                ],
                sort: {
                    created_at: 'desc'
                },
            })
            return res.json(commentList)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.postComment = [
    [
        body('text')
            .notEmpty().withMessage(_sr['fa'].required.caption),
        body('rate')
            .notEmpty().withMessage(_sr['fa'].required.rate),
        body('product')
            .notEmpty().withMessage(_sr['fa'].required.product)
            .custom(value => {
                return Product.findById(value)
                    .then(prod => {
                        if (!prod) return Promise.reject(_sr['fa'].not_found.product)
                        else return true
                    })
            })
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const { text, rate, product } = req.body
            const data = {
                author: req.user.id,
                text,
                rate,
                product,
            }

            await Comment.create(data)
            return res201(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.deleteComment = [
    async (req, res) => {
        try {
            const id = req?.params?.id
            if (!mongoose.isValidObjectId(id)) return res404(res, _sr[req.lang].not_found.comment)

            const targetComment = await Comment.findById(id)
            if (!targetComment)
                return res404(res, _sr[req.lang].not_found.comment)
            // checking whether the comment is for logged in user or not
            if (targetComment.author == req.user.id) {
                await Comment.findOneAndDelete(id)
                return res200(res, _sr[req.lang].response.success_remove)
            }
            return res403(res, _sr[req.lang].response.unknownError)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]