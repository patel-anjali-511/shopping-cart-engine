const mongoose = require('mongoose')
const cartItemSchema = new mongoose.Schema(
    {
        cart:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"cart",
            required:true
        },
        productId:{
            type:String,
            required:true,
            trim:true
        },
        productName:{
            type:String,
            required:true,
            trim:true
        },
        price:{
            type:Number,
            required:true,
            min:0
        },
         quantity:{
            type:Number,
            required:true,
            min:1,
            default:1
        }
    },{
        timestamps:true
    }
)

const cartItemModel = mongoose.model('cartItem',cartItemSchema)

module.exports = cartItemModel