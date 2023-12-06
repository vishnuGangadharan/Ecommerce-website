const mongoose = require("mongoose")


const productCategrySchema = new mongoose.Schema({
    categoryName:{
        type:String,
        require:true
    },
    description:{
        type:String,
        require:true
    },
    is_desable: {
        type:Boolean,
        require:true
    },
    image:{
        data:Buffer,
        contentType:String
    },
    offer:{
        type:Number,
        default:0
    },
})
const productCategory = mongoose.model(
    "productCategry",
    productCategrySchema
)
module.exports = productCategory