const mongoose = require('mongoose')
const Schema = mongoose.Schema;


function icon(img) {
    if (img) return '/uploads/images/category/' + img
}

const CategorySchema = Schema({
    locale: {
        fa: {
            title: { type: String, unique: true, required: true },
        },
        en: {
            title: { type: String, unique: true, required: true },
        }
    },
    icon: { type: String, get: icon },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    ancestors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    active: { type: Boolean, default: true },
});



CategorySchema.pre('save', async function (next) {
    if (this.isModified('parent') || this.isNew) {
        const ancestors = [this.parent];
        let currentCategory = await mongoose.model('Category').findById(this.parent);
        while (currentCategory && currentCategory.parent) {
            ancestors.push(currentCategory.parent);
            currentCategory = await mongoose.model('Category').findById(currentCategory.parent);
        }
        this.ancestors = ancestors.reverse();
    }
    next()
});

CategorySchema.pre('findOneAndUpdate', async function (doc) {
    // Update the ancestors field based on the new parent value
    if (this.getUpdate().parent) {
        const newParent = await mongoose.model('Category').findById(this.getUpdate().parent);
        if (newParent) {
            const newAncestors = [...newParent.ancestors, newParent._id];
            this.getUpdate().ancestors = newAncestors;
        }
    }
});


module.exports = mongoose.model('Category', CategorySchema)