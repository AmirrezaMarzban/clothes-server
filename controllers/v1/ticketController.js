const mongoose = require('mongoose')
const Ticket = require('../../models/Ticket')
const { _sr } = require('../../helpers/serverResponses')
const { res200, res201, res404, res422, res500, checkValidations, res403 } = require('../../helpers/statusCodes')
const { body, validationResult } = require('express-validator')
const { generateRandomDigits } = require('../../helpers/controllersHelperFunctions')


const limit = 5

//////////////////////////////////////////////////////////////////////////////// admin
module.exports.getTicketsByAdmin = [
    async (req, res) => {
        try {
            const ticketList = await Ticket.paginate({}, {
                page: req?.query?.page,
                limit,
                sort: {
                    created_at: 'desc'
                },
                select: 'ticketsNumber subject'
            });
            return res.json(ticketList)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.getTicketsDetailByAdmin = [
    async (req, res) => {
        try {
            const ticketNumber = req?.params?.ticketNumber
            const targetTicket = await Ticket.findOne({ ticketNumber: ticketNumber })
                .populate('user', 'firstName lastName scope')
                .populate('messages.user', 'firstName lastName scope')
            if (!targetTicket)
                return res404(res, _sr[req.lang].not_found.tickets)

            targetTicket.seeByAdmin = true
            targetTicket.save()
            return res.json(targetTicket)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.replyTicketByAdmin = [
    [
        body('ticketNumber')
            .custom((value, { req }) => {
                return Ticket.findOne({ ticketNumber: value })
                    .then(ticket => {
                        if (ticket) return true
                        else return Promise.reject(_sr[req.lang].not_found.ticket)
                    })
            }),
        body('message')
            .notEmpty().withMessage(_sr['fa'].required.caption),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const { ticketNumber, message } = req.body

            const messages = {
                user: req.user._id,
                message: message
            }

            await Ticket.findOneAndUpdate(
                { ticketNumber: ticketNumber },
                {
                    $push: { messages: messages },
                    $set: { status: 'answered' }
                },
            )
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.changeStatusByAdmin = [
    [
        body('ticketNumber')
            .notEmpty().withMessage(_sr['fa'].required.field),
        body('mode')
            .notEmpty().withMessage(_sr['fa'].required.field),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const { ticketNumber, mode } = req.body;

            const ticket = await Ticket.findOne({ ticketNumber });
            if (!ticket) return res404(res, _sr[req.lang].not_found.tickets);

            const modes = ['closed', 'processing', 'answered']
            if (!modes.includes(mode)) return res422(res, _sr[req.lang].response.wrong_mode)

            ticket.status = mode;
            await ticket.save();

            return res200(res, _sr[req.lang].response.success_save);
        } catch (e) {
            console.error(e);
            return res500(res, _sr[req.lang].response.problem);
        }
    }
];
//////////////////////////////////////////////////////////////////////////////// user
module.exports.getTicketsDetail = [
    async (req, res) => {
        try {
            const ticketNumber = req?.params?.ticketNumber
            const targetTicket = await Ticket.findOne({ ticketNumber: ticketNumber })
                .populate('user', 'firstName lastName scope')
                .populate('messages.user', 'firstName lastName scope')
            if (!targetTicket)
                return res404(res, _sr[req.lang].not_found.tickets)

            targetTicket.seeByUser = true
            targetTicket.save()
            return res.json(targetTicket)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.getTickets = [
    async (req, res) => {
        try {
            const ticketList = await Ticket.paginate({ user: req.user._id }, {
                page: req?.query?.page,
                limit,
                sort: {
                    created_at: 'desc'
                },
                select: 'ticketNumber subject'
            });
            return res.json(ticketList)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.closeTicket = [
    [
        body('ticketNumber')
            .notEmpty().withMessage(_sr['fa'].required.field),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const { ticketNumber } = req.body;

            const ticket = await Ticket.findOne({ ticketNumber });
            if (!ticket) return res404(res, _sr[req.lang].not_found.tickets);

            ticket.status = 'closed';
            await ticket.save();

            return res200(res, _sr[req.lang].response.success_save);
        } catch (e) {
            console.error(e);
            return res500(res, _sr[req.lang].response.problem);
        }
    }
];

module.exports.createTicket = [
    [
        body('subject')
            .notEmpty().withMessage(_sr['fa'].required.title),
        body('message')
            .notEmpty().withMessage(_sr['fa'].required.caption),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const _id = new mongoose.Types.ObjectId();

            const { subject, message, priority } = req.body

            const modes = ['low', 'medium', 'high']
            if (priority != null) {
                if (!modes.includes(priority))
                    return res422(res, _sr[req.lang].response.wrong_mode)
            }
            const messages = {
                user: req.user._id,
                message: message
            }
            let randomTicketNumber = generateRandomDigits(10)
            while (true) {
                const ticket = await Ticket.findOne({ ticketNumber: randomTicketNumber })
                if (ticket)
                    randomTicketNumber = generateRandomDigits(10)
                else
                    break
            }
            const data = {
                _id,
                ticketNumber: randomTicketNumber,
                subject,
                messages,
                priority,
                user: req.user._id
            }

            await Ticket.create(data)
            return res201(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]

module.exports.replyTicket = [
    [
        body('ticketNumber')
            .custom((value, { req }) => {
                return Ticket.findOne({ ticketNumber: value })
                    .then(ticket => {
                        if (ticket) return true
                        else return Promise.reject(_sr[req.lang].not_found.ticket)
                    })
            }),
        body('message')
            .notEmpty().withMessage(_sr['fa'].required.caption),
    ],
    checkValidations(validationResult),
    async (req, res) => {
        try {
            const { ticketNumber, message } = req.body
            const messages = {
                user: req.user._id,
                message: message
            }
            const targetTicket = await Ticket.findOne({ ticketNumber: ticketNumber })
            if (targetTicket.status == 'closed')
                return res403(res, _sr[req.lang].response.unknownError)

            await Ticket.findOneAndUpdate(
                { ticketNumber: ticketNumber },
                {
                    $push: { messages: messages },
                }
            )
            return res200(res, _sr[req.lang].response.success_save)
        } catch (e) {
            console.log(e)
            return res500(res, _sr[req.lang].response.problem)
        }
    }
]