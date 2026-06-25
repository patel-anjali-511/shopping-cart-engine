const cartModel = require('../models/cart.model')
const cartItemModel = require('../models/cartItem.model')
const userModel = require('../models/user.model')

const addItemToCart = async(req,res)=>{
  try{
    const {userId, productId,productName,price,quantity} = req.body
   const user = await userModel.findById(userId)

   if(!user){
    return res.status(404).json({
        message:"user not found"
    })
   }

  let cart = await cartModel.findOne({
    user:userId,
    status:"ACTIVE"
  })

   if(!cart){
    cart = await cartModel.create({
        user:userId
    })
   }

   const exsistingItem = await cartItemModel.findOne({
    cart:cart._id,
    productId:productId
   })
   if(exsistingItem){
    exsistingItem.quantity += quantity

    await exsistingItem.save()
   }else{
    await cartItemModel.create({
        
       cart: cart._id,
        productId,
        productName,
        price,
        quantity,
    })
   }
    const cartItems = await cartItemModel.find({
    cart: cart._id,
});
  let totalItems = 0;
let totalAmount = 0;

for (const item of cartItems) {
    totalItems += item.quantity;
    totalAmount += item.quantity * item.price;
}

cart.totalItems = totalItems;
cart.totalAmount = totalAmount;

await cart.save();


res.status(200).json({
    message: "Item added successfully",
    cart,
    cartItems,
});
  }catch(error){
    res.status(500).json({
        message:error.message
    })
  }
}

module.exports={
    addItemToCart
}