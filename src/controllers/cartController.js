const cartModel = require('../models/cart.model');
const cartItemModel = require('../models/cartItem.model');
const userModel = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/responce');

/**
 * Helper utility to retrieve requester identity from headers, query, or body
 * for multi-tenant isolation verification.
 */
const getRequesterUserId = (req) => {
  return req.headers['x-user-id'] || (req.body && req.body.userId) || req.query.userId;
};

/**
 * Add an item to the shopping cart
 */
const addItemToCart = async (req, res, next) => {
  try {
    const { userId, productId, productName, price, quantity } = req.body;

    // Verify user tenant exists
    const user = await userModel.findById(userId);
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    // Retrieve or create active cart for the user
    let cart = await cartModel.findOne({ user: userId, status: "ACTIVE" });
    if (!cart) {
      cart = await cartModel.create({ user: userId });
    }

    // Check if the item already exists in this cart
    let existingItem = await cartItemModel.findOne({ cart: cart._id, productId });
    
    if (existingItem) {
      existingItem.quantity += Number(quantity);
      await existingItem.save();
    } else {
      await cartItemModel.create({
        cart: cart._id,
        productId,
        productName,
        price,
        quantity: Number(quantity)
      });
    }

    // Retrieve all cart items and calculate totals
    const cartItems = await cartItemModel.find({ cart: cart._id });
    let totalItems = 0;
    let totalAmount = 0;

    for (const item of cartItems) {
      totalItems += item.quantity;
      totalAmount += item.quantity * item.price;
    }

    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;
    await cart.save();

    return successResponse(res, 200, "Item added successfully", { cart, cartItems });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch the active cart for a specific user (with tenant protection)
 */
const getCart = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Security: Verify tenant owner access
    const requesterId = getRequesterUserId(req);
    if (requesterId && requesterId !== userId) {
      return errorResponse(res, 403, "Access denied: You do not own this cart session");
    }

    const cart = await cartModel.findOne({ user: userId, status: "ACTIVE" });
    if (!cart) {
      return errorResponse(res, 404, "Cart not found");
    }

    const cartItems = await cartItemModel.find({ cart: cart._id });
    return successResponse(res, 200, "Cart retrieved successfully", { cart, cartItems });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity (with strict tenant security checking)
 */
const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Security: Extract requester user identity
    const requesterId = getRequesterUserId(req);
    if (!requesterId) {
      return errorResponse(res, 400, "Missing user identification (userId or X-User-Id header)");
    }

    const item = await cartItemModel.findById(itemId);
    if (!item) {
      return errorResponse(res, 404, "Cart item not found");
    }

    const cart = await cartModel.findById(item.cart);
    if (!cart) {
      return errorResponse(res, 404, "Associated cart not found");
    }

    // Security: Assert cart ownership matches requester
    if (cart.user.toString() !== requesterId) {
      return errorResponse(res, 403, "Access denied: You do not own this cart item");
    }

    item.quantity = Number(quantity);
    await item.save();

    // Recalculate totals
    const cartItems = await cartItemModel.find({ cart: cart._id });
    let totalItems = 0;
    let totalAmount = 0;

    for (const item of cartItems) {
      totalItems += item.quantity;
      totalAmount += item.quantity * item.price;
    }

    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;
    await cart.save();

    return successResponse(res, 200, "Quantity updated successfully", { cart, cartItems });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an item from the cart (with strict tenant security checking)
 */
const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Security: Extract requester user identity
    const requesterId = getRequesterUserId(req);
    if (!requesterId) {
      return errorResponse(res, 400, "Missing user identification (userId or X-User-Id header)");
    }

    const item = await cartItemModel.findById(itemId);
    if (!item) {
      return errorResponse(res, 404, "Cart item not found");
    }

    const cart = await cartModel.findById(item.cart);
    if (!cart) {
      return errorResponse(res, 404, "Associated cart not found");
    }

    // Security: Assert cart ownership matches requester
    if (cart.user.toString() !== requesterId) {
      return errorResponse(res, 403, "Access denied: You do not own this cart item");
    }

    await cartItemModel.findByIdAndDelete(itemId);

    // Recalculate remaining totals
    const cartItems = await cartItemModel.find({ cart: cart._id });
    let totalItems = 0;
    let totalAmount = 0;

    for (const item of cartItems) {
      totalItems += item.quantity;
      totalAmount += item.quantity * item.price;
    }

    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;
    await cart.save();

    return successResponse(res, 200, "Item removed successfully", { cart, cartItems });
  } catch (error) {
    next(error);
  }
};

/**
 * Return summary and checkout calculations (with campaign engine calculations & bugfixes)
 */
const checkout = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Security: Verify tenant owner access
    const requesterId = getRequesterUserId(req);
    if (requesterId && requesterId !== userId) {
      return errorResponse(res, 403, "Access denied: You do not own this cart session");
    }

    const cart = await cartModel.findOne({ user: userId, status: "ACTIVE" });
    if (!cart) {
      return errorResponse(res, 404, "Cart not found");
    }

    const cartItems = await cartItemModel.find({ cart: cart._id });
    if (cartItems.length === 0) {
      return errorResponse(res, 400, "Cart is empty");
    }

    const subtotal = cart.totalAmount;
    let discount = 0;
    let promotionsApplied = [];

    // Tiered Promotional Campaign Engine
    // 1. Value-based tiers (Gold/Silver)
    if (subtotal >= 10000) {
      discount = subtotal * 0.10;
      promotionsApplied.push("Gold Discount (10%)");
    } else if (subtotal >= 5000) {
      discount = subtotal * 0.05;
      promotionsApplied.push("Silver Discount (5%)");
    }

    // 2. Diversity bonus tier (3 or more distinct products in cart)
    if (cartItems.length >= 3) {
      discount += 500;
      promotionsApplied.push("Diversity Bonus ₹500");
    }

    // Prevent negative final amount and capping discount at subtotal
    if (discount > subtotal) {
      discount = subtotal;
    }

    const finalAmount = Math.max(0, subtotal - discount);

    return successResponse(res, 200, "Checkout Summary", {
      cart,
      cartItems,
      subtotal,
      discount,
      finalAmount,
      promotionsApplied
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addItemToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  checkout
};