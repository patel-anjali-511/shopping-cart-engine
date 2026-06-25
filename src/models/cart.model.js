const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
            required:true,
              },
        totalAmount:{
            type:Number,
            default:0,
        },
        totalItems:{
           type:Number,
           default:0,
        },
        status:{
            type:String,
            enum:["ACTIVE" , "CHECKED_OUT"],
            default:"ACTIVE"
        }
    },{
        timestamps:true
    }
)

const cartModel = mongoose.model("cart",cartSchema)
module.exports =  cartModel