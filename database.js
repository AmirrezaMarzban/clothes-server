const mongoose = require('mongoose')

mongoose.plugin(schema => {
  schema.set('toObject', {
    getters: true
  })
  schema.set('toJSON', {
    getters: true
  })
  schema.set('timestamps', {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  })
})

// mongodb database connection string.
mongoose.connect('mongodb://127.0.0.1:27017/clothes-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// mongoose.connect('mongodb://root:GOWliCTsBHN1K5DD1YeGWt6b@clothes-db:27017/my-app?authSource=admin', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })

const database = mongoose.connection
database.on('error', console.error.bind(console, 'connection error:'))
database.once('open', function callback() {
  console.log("MongoDB Connected...")
})

module.exports = database
