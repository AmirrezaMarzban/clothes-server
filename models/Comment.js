const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')


const CommentSchema = Schema({
    author: { type: mongoose.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    rate: { type: Number },
    active: { type: Boolean, default: false },
    product: { type: mongoose.ObjectId, ref: 'Product' }
});


CommentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Comment', CommentSchema)