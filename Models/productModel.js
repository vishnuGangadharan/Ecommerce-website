const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    product_name : {
        type:String,
        require:true
    },
   
    brand_name : {
        type:String,
        require:true
    },
   
    price:{
        type:Number,
        require:true
    },
 
    stock_count:{
        type:Number,
        require:true
    },
    description : {
        type:String,
        require:true
    },
    category : {
        type: mongoose.Schema.Types.ObjectId,
        ref:'productCategry'
    },
    in_stock:{
        type:Boolean,
        require:true
    },
  
    images : [{
        data:Buffer,
        contentType:String
    }],
    color : {
        type:String,
        require:true
    },
    is_delete : {
        type:Boolean,
        default:false
    },
    offer:{
        type:Number,
        default:0
    }
})

const product = mongoose.model(
    "product",
    productSchema
)

module.exports = product