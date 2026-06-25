const userModel = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/responce');

const createUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, "User already exists", { existingUser });
    }

    const user = await userModel.create({ name, email });
    return successResponse(res, 201, "User created successfully", { user });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await userModel.find();
    return successResponse(res, 200, "Users retrieved successfully", { users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "User retrieved successfully", { user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const user = await userModel.findByIdAndUpdate(
      id,
      { name, email },
      { new: true, runValidators: true }
    );

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "User updated successfully", { user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userModel.findByIdAndDelete(id);

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
