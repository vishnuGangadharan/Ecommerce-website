const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    userName:{
        type: String,
        require:true
    },
    phone:{
        type:Number,
        require:true,
        minLength:10
    },

    email:{
        type:String,
        require:true,
        lowercase:true
    },
    gender:{
        type:String,
        require:true,
    },
    password:{
        type:String,
        require:true,
        minLength: 6
    },
    confirmpassword:{
        type:String,
        require:true
    },
    is_varified:{
        type:Boolean,
        default:true
    },
    is_block:{
        type:Boolean,
        default:false
    },
    is_Admin:{
        type:Boolean,
        default:false
    },
    image:{
        data:Buffer,
        contentType:String
    },
    wishlist:[
        { type: mongoose.Types.ObjectId, ref:'product'}
    ],
    cart:[{
         product:{
            type:mongoose.Schema.Types.ObjectId,
            ref: 'product',  // Assuming you have a 'Product' model in your application
          },
          quantity:{
            type: Number,
            default:1
          },
          totalAmount:{
            type : Number
          }
    }],
    grandTotal :{
        type : Number,
        default:0
    },
    wallet: {
        balance: {
            type: Number,
            default: 0,
        },
        transactions: [{
            amount: {
                type: Number,
                required: true,
            },
            description: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                enum: ['Credit', 'Debit'],
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            }
        }],
    },
    earnedCoupons: [
        {
            coupon: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Coupon',
            },
            isUsed: {
                type: Boolean,
                default: false,
            },
        }
    ],
    
})

const User = mongoose.model('User',userSchema)
module.exports = User;