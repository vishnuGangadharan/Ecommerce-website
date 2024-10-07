const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    amount:{ 
        type : Number,
        require:true,
    },
    description:{
        type:String,
        require:true,
    },
    date:{
        type: Date,
        default:Date.now(),
    },
})

const walletSchema = mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    balance:{
        type: Number,
        default:0,
    },
    transactions: [transactionSchema],
})


module.exports = mongoose.model('wallet',walletSchema)