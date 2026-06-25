const userModel = require('../models/user.model')

const createUser = async (req,res)=>{
    const {name,email}= req.body

    try{

        const {name,email}= req.body

        const existingUser = await userModel.findOne({email})

        if(existingUser){
            return res.stutus(400).json({
                message:"User already exists",
                existingUser
            })
        }

        const user = await userModel.create({
            name,
            email
        })
        res.status(201).json({
            message:"user created successfully",
            user
        })

    }catch(error){
        res.status(500).json({
            message:error.message
        })

    }
}

const getUsers = async (req,res)=>{
    const users = await userModel.find()

    res.status(200).json({
        users
    })
}

const getUserById = async (req,res)=>{
    const {id} = req.params

    const user = await userModel.findById(id)

    if(!user){
        return res.status(404).json({
            message:"user not found"
        })
    }

    res.status(200).json({
        user
    })
}

const updateUser = async(req,res)=>{
    const {id} = req.params
    const {name,email} = req.body

    const user = await userModel.findByIdAndUpdate(id,{
        name,
        email,
    }, {new:true})


    if(!user){
    return res.status(404).json({
        message:"user not found",

    })
}
 res.status(200).json({
    message:"user updated successfully",
    user
 })
}


const deleteUser = async (req,res)=>{
    const {id} = req.params
    const user = await userModel.findByIdAndDelete(id)

    if(!user){
        return res.status(404).json({
            message:"user not found"
        })
    }

    res.status(200).json({
        message:"user deleted successfullyuse"
    })
}


module.exports ={
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
}
