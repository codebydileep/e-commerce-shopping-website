const mongoose=require('mongoose');
const productsSchema=new mongoose.Schema({ //create schema userName, password
    productImage:String,
    productName:String,
    price:Number,
    category:String,
    Description:String
})

module.exports=mongoose.model('Products',productsSchema) //export the schema
