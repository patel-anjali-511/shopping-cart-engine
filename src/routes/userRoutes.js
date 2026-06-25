const express = require('express');
const { body, param } = require('express-validator');
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const validateRequest = require('../services/validateRequest');

const router = express.Router();

router.post('/', [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required and cannot be empty'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email format'),
  validateRequest
], createUser);

router.get('/', getUsers);

router.get('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Must be a valid MongoDB ObjectId format'),
  validateRequest
], getUserById);

router.put('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Must be a valid MongoDB ObjectId format'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty when provided'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Must be a valid email format when provided'),
  validateRequest
], updateUser);

router.delete('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Must be a valid MongoDB ObjectId format'),
  validateRequest
], deleteUser);

module.exports = router;