const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    userName:{
        type: String,
        require: true
    },
    email:{
        type: String,
        require: true
    },
    mobile:{
        type: Number,
        require:true,
    },
    houseName:{
        type: String,
        require:true,
    },
    place:{
        type: String,
        require: true
    },
    post:{
        type: String,
        require:true
    },
    postCode:{
        type: String,
        require:true
    },
    district:{
        type: String,
        require: true
    },
    state:{
        type: String,
        require:true
    },
    country:{
        type: String,
        require: true
    }, 
    default: {
        type: Boolean,
        default: false,
    },
})

const address = mongoose.model('Address', addressSchema);

module.exports = address;
