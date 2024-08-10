const mongoose=require('mongoose');
const products = require('./products');
const orderSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' }, // Reference to Product model
    address: { type: String}
});



const usersSchema=new mongoose.Schema({ //create schema userName, password
    userName:String,
    password:String,
    products:[{type:mongoose.Schema.Types.ObjectId,ref:'Products'}],
    orders:[orderSchema]
})

module.exports=mongoose.model('Users',usersSchema) //export the schema
