const mongoose = require('mongoose')
const Comment = require('../models/Comment')
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

function slide(img) {
    if (img) return '/uploads/images/product/' + img
}

function thumbnail(img) {
    if (img) return '/uploads/images/product/thumb/' + img
}

const PriceSchema = Schema({
    locale: {
        fa: {
            weight: { type: String, required: true },
        },
        en: {
            weight: { type: String, required: true },
        }
    },
    price: { type: String, required: true }
})

const ProductSchema = Schema({
    locale: {
        fa: {
            name: { type: String, required: true },
            description: { type: String, required: true },
            meta_tag: { type: String, default: '' },
            meta_description: { type: String, default: '' },
        },
        en: {
            name: { type: String, required: true },
            description: { type: String, required: true },
            meta_tag: { type: String, default: '' },
            meta_description: { type: String, default: '' },
        }
    },
    images: Array,
    prices: [PriceSchema],
    thumbnail: { type: String, get: thumbnail },
    category: { type: mongoose.ObjectId, ref: 'Category' },
    owner: { type: mongoose.ObjectId, ref: 'User' },
    // brand: { type: mongoose.ObjectId, ref: 'Brand' },
    store: { type: mongoose.ObjectId, ref: 'Store' },
    rate: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    active: { type: Boolean, default: false },
    deleted_request: { type: Boolean, default: false },
})

ProductSchema.pre('findOneAndUpdate', async function (doc) {
    if (this.getUpdate().images) {
        let images = []
        this.getUpdate().images.forEach((image, index) => {
            images.push(slide(image))
        })

        this.getUpdate().images = images;
    }
})

// calculate the average
ProductSchema.post('find', async function(docs) {
    if(Array.isArray(docs)) {
        docs.forEach((doc, index) => {
            doc.calculateAverage(doc)
        })
    } else {
        docs.calculateAverage(docs)
    }
    
});

ProductSchema.methods.calculateAverage = async function(doc) {
    const comments = await Comment.find({ product: doc._id });
    console.log(comments);
    if (comments.length === 0) {
        doc.rate = 0;
    } else {
      const totalRatings = comments.reduce((total, comment) => total + comment.rate, 0);
      doc.rate = totalRatings / comments.length;
    }
}

ProductSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', ProductSchema)