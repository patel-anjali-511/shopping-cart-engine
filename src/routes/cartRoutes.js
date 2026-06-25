const express = require('express')
const {addItemToCart} = require('../controllers/cartController')
const router = express.Router()

router.post('/add-item',addItemToCart)

module.exports = router