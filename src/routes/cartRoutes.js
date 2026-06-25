const express = require('express')
const {addItemToCart, getCart, updateCartItem, removeCartItem, checkout} = require('../controllers/cartController')
const router = express.Router()

router.post('/add-item',addItemToCart)
router.get('/:userId',getCart)
router.put('/update-item/:itemId',updateCartItem)
router.delete('/remove-item/:itemId' ,removeCartItem)
router.get('/checkout/:userId', checkout)

module.exports = router