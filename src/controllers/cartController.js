const cartModel = require('../models/cart.model')
const cartItemModel = require('../models/cartItem.model')
const userModel = require('../models/user.model')

const addItemToCart = async(req,res)=>{
  try{
    const {userId, productId,productName,price,quantity} = req.body
    if (!userId || !productId || !productName || !price || !quantity) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        message: "Invalid price"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero"
      });
    }
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

const getCart = async (req,res)=>{
    try{
        const {userId} = req.params
        const cart = await cartModel.findOne({
            user:userId,
            status:"ACTIVE"
        })
        if(!cart){
            return res.status(404).json({
                message:"cart not found"
            })
        }

        const cartItems = await cartItemModel.find({
            cart:cart._id
        })
        res.status(200).json({
            cart,
            cartItems
        })

    }catch(error){
           res.status(500).json({
            message:error.message
           })
    }
}



const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Find the cart item
    const item = await cartItemModel.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    // Update quantity
    item.quantity = quantity;
    await item.save();

    // Find the cart
    const cart = await cartModel.findById(item.cart);

    // Get all items of this cart
    const cartItems = await cartItemModel.find({
      cart: cart._id,
    });

    // Recalculate totals
    let totalItems = 0;
    let totalAmount = 0;

    for (const item of cartItems) {
      totalItems += item.quantity;
      totalAmount += item.quantity * item.price;
    }

    // Update cart totals
    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;

    await cart.save();

    res.status(200).json({
      message: "Quantity updated successfully",
      cart,
      cartItems,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Find the cart item
    const item = await cartItemModel.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    // Find the cart
    const cart = await cartModel.findById(item.cart);

    // Delete the item
    await cartItemModel.findByIdAndDelete(itemId);

    // Get remaining items
    const cartItems = await cartItemModel.find({
      cart: cart._id,
    });

    // Recalculate totals
    let totalItems = 0;
    let totalAmount = 0;

    for (const item of cartItems) {
      totalItems += item.quantity;
      totalAmount += item.quantity * item.price;
    }

    // Update cart totals
    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;

    await cart.save();

    res.status(200).json({
      message: "Item removed successfully",
      cart,
      cartItems,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const checkout = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find active cart
    const cart = await cartModel.findOne({
      user: userId,
      status: "ACTIVE",
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // Get all cart items
    const cartItems = await cartItemModel.find({
      cart: cart._id,
    });

    // If cart is empty
    if (cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    // Cart subtotal
    const subtotal = cart.totalAmount;

    // Promotion Engine
    let discount = 0;
    let promotionsApplied = [];

    // Gold Offer
    if (subtotal >= 10000) {
      discount = subtotal * 0.10;
      promotionsApplied.push("Gold Discount (10%)");
    }

    // Silver Offer
    else if (subtotal >= 5000) {
      discount = subtotal * 0.05;
      promotionsApplied.push("Silver Discount (5%)");
    }

    // Bonus Diversity Offer
    if (cartItems.length >= 3) {
      discount += 500;
      promotionsApplied.push("Diversity Bonus ₹500");
    }

    // Final Amount
    const finalAmount = subtotal - discount;

    res.status(200).json({
      message: "Checkout Summary",

      cart,

      cartItems,

      subtotal,

      discount,

      finalAmount,

      promotionsApplied,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


module.exports={
    addItemToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    checkout
}