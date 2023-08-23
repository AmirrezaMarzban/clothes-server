require('dotenv').config()
require('./database')
// const bodyParser = require('body-parser') for old express versions
const fileUpload = require('express-fileupload')
const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
const port = process.env.PORT || 80

///////// global variable
global._ = require('lodash');
global.axios = require('axios');

//////// middlewares
app.use(cookieParser(process.env.COOKIE_SECRET_KEY))
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/static'));
// parse application/json
app.use(express.json())
app.use(fileUpload())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Require & Import API routes v1
const apiV1 = require('./routes/v1/index')

// Use lang middleware for all routes
app.use('/api/v1/:lang', (req, res, next) => {
  if (req.params.lang == 'fa' || req.params.lang == 'en')
    req.lang = req.params.lang
  else
    req.lang = 'en'
  next()
})
// Use API Routes v1
app.use('/api/v1/:lang', apiV1)
console.log(global.lang);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
