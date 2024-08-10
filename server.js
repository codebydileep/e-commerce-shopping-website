const bodyParser = require('body-parser')
const express=require('express')
const { check, validationResult}=require('express-validator')
const ejs=require('ejs')
const session=require('express-session')
const flash=require('express-flash')
const path=require('path')
const { default: mongoose } = require('mongoose')
const usersinDb=require('./models/users')
const productsinDb=require('./models/products')
const { error } = require('console')
const app=express()
const port=8500
mongoose.connect('mongodb://localhost:27017/ShopZDb')
app.set('view engine','ejs')
app.use(express.json())
app.use(session({
    secret:"secret key",
    resave:false,
    saveUninitialized:true,
    cookie:{
        maxAge:600000
    }
    
}))
app.use(flash())
app.use(bodyParser.urlencoded({extended:false}))
app.use('/public', express.static('public'));


app.get('/',async(req,res)=>{
   
   const productsData=await productsinDb.find() //fetch data in database and display in page
    
   await res.render('./userConsole/index.ejs',{productsinDb:productsData})  
})
app.get('/addtocart',async(req,res)=>{
    req.flash("error","Access Denied!. Please Login/Register to shop")
    await res.redirect('/LoginOrRegister') 
 })

 app.get('/mycart',async(req,res)=>{
    req.flash("error","Access Denied!. Please Login/Register to shop")
    await res.redirect('/LoginOrRegister') 
 })
 

 
app.get('/LoginOrRegister',async(req,res)=>{
    
 
    await res.render('./userConsole/LoginOrRegister.ejs',{errors:''})
     
     
 })
 const passwordValidator = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

 app.post('/LoginOrRegister',
    [   
        check('userName')
            .notEmpty().withMessage('User name is required')
            .custom((value, { req }) => {
                // Convert user input to lowercase for case-insensitive comparison
                const userName = value.toLowerCase();
                return usersinDb.findOne({ userName }).then(user => {
                    if (user) {
                        // If user exists, throw an error
                        return Promise.reject('Username already exists');
                    }
                });
            }),
        check('password')
            .matches(passwordValidator)
            .withMessage('Password must be at least 8 characters long and contain at least one alphabet, one number, and one special character.')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        const data = {
            userName: req.body.userName,
            password: req.body.password
        }
        if (!errors.isEmpty()) {   
            res.render('./userConsole/LoginOrRegister.ejs', {
                errors: errors.mapped()
            });
        } else {
            // Convert user input to lowercase for case-insensitive comparison
            data.userName = data.userName.toLowerCase();
            const userFind = new usersinDb(data);
            await userFind.save();
            req.flash("success", "Welcome " + data.userName + ". Happy Shopping!");
            res.redirect('/home/' + userFind._id);
        }
    }
);

 app.get('/Login',async(req,res)=>{
 
    await res.render('./userConsole/Login.ejs')   
 })
 app.post('/Login',async(req,res)=>{
    try{
        const data={
            userName:req.body.userName,
            password:req.body.password
        }
        //validating data
    const userFind=await usersinDb.findOne(data);

        if(userFind==null){
            req.flash("error"," Username or password is incorrect")
            res.redirect('Login')
            
        }
        else{
            
            req.flash("success"," Welcome "+data.userName+". Happy Shopping!")
            
            req.session.id=userFind._id
            const productsData=await productsinDb.find()
            const datasend={
                userFind:userFind,
                productsinDb:productsData
            }
          
            res.redirect('/home/'+userFind._id)
            
               
                   
        }

    }
    catch(error){
        console.log(error)
}
 
 })
 app.get('/viewmore/:productId',async(req,res)=>{
    
    let productId=req.params.productId
    const productsData=await productsinDb.findById(productId) //fetch data in database and display in page
    
    res.render('./userConsole/productDetails.ejs',{productsData:productsData})  
  })
  app.get('/home',async(req,res)=>{
    req.flash("error","Access Denied!. Please Login/Register to shop")
    await res.redirect('/LoginOrRegister') 
  })
 app.get('/home/:userid',async(req,res)=>{
   
     const userid=req.params.userid
     const productsData=await productsinDb.find()
     const userFind=await usersinDb.findById(userid);
     const datasend={
         userFind:userFind,
         productsinDb:productsData
     }
     res.render('./userConsole/home.ejs',datasend)  
      
      
  }) 

 app.post('/home/addtocart/:userId/:productId',async(req,res)=>{
    const userId=req.params.userId;
    const productId=req.params.productId;
    try {
        const product = await productsinDb.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        const user = await usersinDb.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.products.push(product);
        await user.save();

       
        req.flash('success',product.productName+" is added to your cart")
       
        res.redirect('/home/'+userId)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
 })
 
 app.get('/home/mycart/:userId', async (req, res) => {
    const userId=req.params.userId;
    try {
        const userFind=await usersinDb.findById(userId)
        const user = await usersinDb.findById(userId).populate('products');

        
        
        res.render('./userConsole/myCart.ejs', { userId: userId,userFind:userFind,products: user.products });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/delete/cartItem/:userId/:productId/:productIndex',async(req,res)=>{
    
    const productId = req.params.productId;
    const userId=req.params.userId
    const productIndex=req.params.productIndex
    try {
        const user = await usersinDb.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        // Remove the product from the cart array
        
        user.products.splice(productIndex, 1);
        await user.save();
        req.flash('success',"Item removed from your cart")
        res.redirect('/home/mycart/'+userId)
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
  
         
    
        
  })
  app.get('/home/viewmore/:userId/:productId',async(req,res)=>{
    let userId=req.params.userId
    let productId=req.params.productId
    const productsData=await productsinDb.findById({_id:productId})
    try {
        const userFind = await usersinDb.findById(userId);
        if (!userFind) {
            return res.status(404).send('User not found');
        }
    const datasend={
        userFind:userFind,
        productsData:productsData
    }
    res.render('./userConsole/productDetails.ejs',datasend)
    }
catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
}
  })

  app.get('/home/purchase/:userId/:productId',async(req,res)=>{
    let userId=req.params.userId
    let productId=req.params.productId
    const productsData=await productsinDb.findById({_id:productId})
    try {
        const userFind = await usersinDb.findById(userId);
        if (!userFind) {
            return res.status(404).send('User not found');
        }
    const datasend={
        userFind:userFind,
        productsData:productsData
    }
    res.render('./userConsole/purchase.ejs',datasend)
    }
catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
}
  })
  app.get('/home/payAndOrder/:userId/:productId',async(req,res)=>{
    let userId=req.params.userId
    let productId=req.params.productId
    const productsData=await productsinDb.findById({_id:productId})
    try {
        const userFind = await usersinDb.findById(userId);
        if (!userFind) {
            return res.status(404).send('User not found');
        }
    const datasend={
        userFind:userFind,
        productsData:productsData
    }
    res.render('./userConsole/payAndOrder.ejs',datasend)
    }
catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
}
  })
  app.post('/home/confirmOrder/:userId/:productId',async(req,res)=>{
    const userId=req.params.userId;
    const productId=req.params.productId;
    const {address}=req.body
    try {
        const product = await productsinDb.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        const user = await usersinDb.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        const data=
        {   product:product,
            address:address
        }

        user.orders.push(data);
        await user.save();

       
        req.flash('success',"Your order is confirmed for "+product.productName)
       
        res.redirect('/home/myorders/'+userId)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

  })

  app.get('/home/myorders/:userId', async (req, res) => {
    const userId=req.params.userId;
    try {
        const userFind=await usersinDb.findById(userId)
        const user = await usersinDb.findById(userId).populate(
            {
                path: 'orders',
                populate: { path: 'product' }
            }
        );

        
        
        res.render('./userConsole/myOrders.ejs', { userId: userId,userFind:userFind,orders: user.orders });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
  
 app.get('/adminLogin',async(req,res)=>{
 
    await res.render('./adminConsole/adminLogin.ejs')
        
 })
app.post('/adminLogin',async(req,res)=>{
    try{
        const data={
            adminName:req.body.adminName,
            adminPassword:req.body.adminPassword
        }
        //validating data
   
        if(data.adminName==="adminGen" && data.adminPassword==="passAdmin83"){
            req.flash("success"," Welcome "+data.adminName+" to the admin console")
            res.redirect('/adminHome/')  
            
        }
        else{
                    
            req.flash("error"," Username or password is incorrect")
            res.redirect('/adminLogin')
                   
        }

    }
    catch(error){
        console.log(error)
    }
})
app.get('/admiHome/addProducts',async(req,res)=>{

   
    res.render('./adminConsole/addProducts.ejs',{errors:''})
})
app.post('/adminHome/addProducts',
[   //type check  
    check('productImage').notEmpty().withMessage('Product image url is required'),
    check('productName').notEmpty().withMessage('Product Name is required'),
    check('price').notEmpty().withMessage('Price is required'),
    check('category').notEmpty().withMessage('Category is required'),
    check('Description').notEmpty().withMessage('Product description is required'),

],async(req,res)=>{
     const errors=validationResult(req);
     const {productImage,productName,price,category,Description}=req.body
    if(!errors.isEmpty())
    {   
         res.render('./adminConsole/addProducts.ejs',
         
            {
                    errors:errors.mapped()
                    });
    }
    else{
        const products=new productsinDb({productImage,productName,price,category,Description})
    //wait untill previous line is executed so that server doesnt crash
    await products.save()
    
        req.flash("success",productName+" is added")



    res.redirect('/adminHome')

    }
})

app.get('/showProducts',async(req,res)=>{
   
    const productsData=await productsinDb.find() //fetch data in database and display in page

    res.render('./adminConsole/showProducts.ejs',{productsinDb:productsData})
    
    
})
app.get('/adminHome',async(req,res)=>{
    const productsData=await productsinDb.find() //fetch data in database and display in page

    res.render('./adminConsole/adminHome.ejs',{productsinDb:productsData})
    
    
    
})
app.get('/adminHome/showCustomers',async(req,res)=>{
    const usersData=await usersinDb.find() //fetch data in database and display in page

    res.render('./adminConsole/showCustomers.ejs',{usersinDb:usersData})
   
    
    
})
app.get('/adminhome/showOrders', async (req, res) => {
    try {
        const usersWithOrders = await usersinDb.find({ 'orders': { $exists: true, $not: { $size: 0 } } }).populate('orders.product');

        res.render('./adminConsole/showOrders.ejs', { usersWithOrders });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
  });
app.get('/updateProduct/:id',async(req,res)=>{
    
    let id=req.params.id;
    
    const ProductDataFind=await productsinDb.findById({_id:id});
  
        if(ProductDataFind==null){
            res.redirect('/')
        }
        else{
            
            res.render("./adminConsole/updateProducts.ejs",{ProductDataFind:ProductDataFind})          
        }
          
})
app.post('/updateProduct/:id',async(req,res)=>{
    let id=req.params.id;
    const {productImage,productName,price,category,Description}=req.body
    await productsinDb.findByIdAndUpdate(
        {_id:id},
        {productImage,productName,price,category,Description},
        {new:true});
        req.flash("success",productName+" is Updated")
        res.redirect('/adminHome'); 
        
})
app.get('/delete/:id',async(req,res)=>{
    
    let id=req.params.id;
    
    
      req.flash("success","Product Deleted Successfully!")
      await productsinDb.findByIdAndDelete({_id:id});
      res.redirect('/adminHome');
  
         
    
        
  })

app.post('/adminHome/search',async(req,res)=>{
    try{
        let searchTerm=req.body.searchTerm;
        
        const searchNoSpecialChar=searchTerm.replace(/[^a-zA-Z0-9]/g,"");
      
        const search=await productsinDb.find({
            $or:[
                {productName:{$regex:new RegExp(searchNoSpecialChar,"i")}},
                {category:{$regex:new RegExp(searchNoSpecialChar,"i")}},
                {Description:{$regex:new RegExp(searchNoSpecialChar,"i")}},
                //for release field as its numeric type              
                !isNaN(searchTerm)?{price:searchTerm}:null,                          
            ].filter(Boolean)
        })
        res.render("./adminConsole/adminSearch.ejs",
            {productsinDb:search}
            
        )
    }
    catch(error){
            console.log(error)
    }
            
        
})
app.post('/search',async(req,res)=>{
    try{
        let searchTerm=req.body.searchTerm;
        
        const searchNoSpecialChar=searchTerm.replace(/[^a-zA-Z0-9]/g,"");
      
        const search=await productsinDb.find({
            $or:[
                {productName:{$regex:new RegExp(searchNoSpecialChar,"i")}},
                {category:{$regex:new RegExp(searchNoSpecialChar,"i")}},
                {Description:{$regex:new RegExp(searchNoSpecialChar,"i")}},
                //for release field as its numeric type              
                !isNaN(searchTerm)?{price:searchTerm}:null,                          
            ].filter(Boolean)
        })
        res.render("./userConsole/search.ejs",
            {productsinDb:search}
            
        )
    }
    catch(error){
            console.log(error)
    }
            
        
})
app.get('/home/search/:id',async(req,res)=>{
    res.render('./userConsole/search.ejs')
})

app.post('/home/search/:id',async(req,res)=>{
    try{
        let searchTerm=req.body.searchTerm;
        let id=req.params.id;
        
        const searchNoSpecialChar=searchTerm.replace(/[^a-zA-Z0-9]/g,"");
      
        const search=await productsinDb.find({
            $or:[
                {productName:{$regex:new RegExp(searchNoSpecialChar,"i")}},
                {category:{$regex:new RegExp(searchNoSpecialChar,"i")}},
                {Description:{$regex:new RegExp(searchNoSpecialChar,"i")}},
                //for release field as its numeric type              
                !isNaN(searchTerm)?{price:searchTerm}:null,                          
            ].filter(Boolean)
        })
        const userFind=await usersinDb.findById(id);
     const datasend={
         userFind:userFind,
         productsinDb:search
     }
        res.render("./userConsole/homeSearch.ejs",
        datasend)
    }
    catch(error){
            console.log(error)
    }
            
        
})


app.listen(port,()=>console.log("server started with port "+port))

