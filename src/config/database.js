const mongoose = require('mongoose')
function connectedToDB(){
 mongoose.connect(process.env.MONGO_URI)
 .then(()=>{
    console.log('connected to db')
 })
}

module.exports = connectedToDB