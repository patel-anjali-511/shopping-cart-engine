const express = require('express')
const app = express()
const userRouter = require('./routes/userRoutes')
const cartRouter = require('./routes/cartRoutes')

app.use(express.json())

app.use('/api/users', userRouter)
app.use('/api/cart', cartRouter)
module.exports = app