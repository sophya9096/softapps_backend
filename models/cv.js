const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const cvSchema = new Schema({
    title: {
        type: String,
    },
    fname: {
        type: String,
    },
    lname: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    employment: {
        type: String,
    },
    experience: {
        type: String,
    },
    letter: {
        type: String,
    },
    cv: {
        type: String,
    },
});

module.exports = mongoose.model("cv", cvSchema);
