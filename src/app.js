const express = require('express');
const app = express();
const loggerMiddleware = require('./services/logger');
const errorHandler = require('./services/errorHandler');
const userRouter = require('./routes/userRoutes');
const cartRouter = require('./routes/cartRoutes');

// Parse incoming request payloads as JSON
app.use(express.json());

// Register request logging middleware (Feature X: request logger)
app.use(loggerMiddleware);

// Define API routes
app.use('/api/users', userRouter);
app.use('/api/cart', cartRouter);

// Register global error handler (Feature X: exception handler)
app.use(errorHandler);

module.exports = app;