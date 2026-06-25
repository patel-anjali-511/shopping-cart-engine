const express = require('express');
const app = express();
const loggerMiddleware = require('./services/logger');
const errorHandler = require('./services/errorHandler');
const userRouter = require('./routes/userRoutes');
const cartRouter = require('./routes/cartRoutes');

app.use(express.json());

app.use(loggerMiddleware);

app.use('/api/users', userRouter);
app.use('/api/cart', cartRouter);

app.use(errorHandler);

module.exports = app;