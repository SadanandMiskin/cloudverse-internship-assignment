//user model

const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
})

const userModel = mongoose.model('userSchema' , userSchema)
module.exports = userModel
