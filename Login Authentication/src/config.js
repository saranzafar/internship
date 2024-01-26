const mongoose = require('mongoose')
const connect = mongoose.connect('mongodb://127.0.0.1:27017/internship', { useUnifiedTopology: true })

connect.then((db) => {
    console.log("Database connected successfully! ", db.connection.host);
}).catch((err) => {
    console.log("Database can't bs connected! ", err);
});
const loginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    confirmPassword: {
        type: String,
        required: true
    },
    checkbox: {
        type: String,
        default: false,
        required: false
    },
});


const collection = new mongoose.model('signup', loginSchema)
module.exports = collection;