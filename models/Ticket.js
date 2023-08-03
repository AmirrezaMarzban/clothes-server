// const mongoose = require('mongoose')
// const Schema = mongoose.Schema;
// const mongoosePaginate = require('mongoose-paginate-v2');

// const TicketSchema = Schema({
//     title: { type: String, required: true }, //subject
//     body: String,
//     creator: { type: mongoose.ObjectId, ref: 'User' },
//     assignee: { type: mongoose.ObjectId, ref: 'User' },
//     parent: { type: mongoose.ObjectId, ref: 'Ticket' },
//     status: {
//         type: String,
//         enum: ['open', 'in progress', 'closed'],
//         default: 'open'
//     }
// });


// TicketSchema.plugin(mongoosePaginate);

// module.exports = mongoose.model('Ticket', TicketSchema)

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');


const MessagesSchema = mongoose.Schema({
    user: { type: mongoose.ObjectId, ref: 'User' },
    message: String,
})

const SupportTicketSchema = mongoose.Schema({
    ticketNumber: String,
    subject: String,
    user: { type: mongoose.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['closed', 'processing', 'answered'],
        default: 'processing'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    whatPart: String,
    messages: [MessagesSchema],
    seeByUser: { type: Boolean, default: false },
    seeByAdmin: { type: Boolean, default: false }
})


SupportTicketSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Ticket', SupportTicketSchema)