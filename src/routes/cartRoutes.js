const express = require('express');
const { body, param } = require('express-validator');
const { addItemToCart, getCart, updateCartItem, removeCartItem, checkout } = require('../controllers/cartController');
const validateRequest = require('../services/validateRequest');

const router = express.Router();

// Add item to cart validation
router.post('/add-item', [
  body('userId')
    .isMongoId()
    .withMessage('Must be a valid MongoDB ObjectId for user'),
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required'),
  body('productName')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number greater than 0'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be an integer of 1 or more'),
  validateRequest
], addItemToCart);

// Fetch cart validation
router.get('/:userId', [
  param('userId')
    .isMongoId()
    .withMessage('Must be a valid MongoDB ObjectId for user'),
  validateRequest
], getCart);

// Update item quantity validation
router.put('/update-item/:itemId', [
  param('itemId')
    .isMongoId()
    .withMessage('Must be a valid MongoDB ObjectId for cart item'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be an integer of 1 or more'),
  validateRequest
], updateCartItem);

// Remove item validation
router.delete('/remove-item/:itemId', [
  param('itemId')
    .isMongoId()
    .withMessage('Must be a valid MongoDB ObjectId for cart item'),
  validateRequest
], removeCartItem);

// Checkout validation
router.get('/checkout/:userId', [
  param('userId')
    .isMongoId()
    .withMessage('Must be a valid MongoDB ObjectId for user'),
  validateRequest
], checkout);

module.exports = router;