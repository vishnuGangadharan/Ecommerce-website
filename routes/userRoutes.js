const express = require('express')
const user_route = express.Router()
const Auth = require('../middileware/Auth')
const Controler = require('../Controler/user/registerAndLogin')
const productControl = require('../Controler/admin/productControl')
const cartControl= require('../Controler/user/cartControl')
const profileControl = require('../Controler/user/profileControl')

const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

user_route.get('/',Controler.loadhome)
user_route.get('/userLogin',Auth.userloggedout,Controler.loadLogin)
user_route.get('/logout',Auth.userAuth,Controler.logout)
user_route.post('/userlogin',Auth.userloggedout,Controler.uservalidation)

user_route.get('/register',Auth.userloggedout,Controler.loadRegiser)
user_route.post('/register',Auth.userloggedout,Controler.insertUser)
user_route.post('/verificaton',Controler.otpVarification)

user_route.get('/shop',productControl.loadShop)
user_route.get('/product/Details/:id',productControl.productDetails)

user_route.get('/cart',Auth.checkToBlock,Auth.userAuth,cartControl.loadCart)
user_route.post('/cart/:id/passdata',Auth.checkToBlock,Auth.userAuth,cartControl.addCart)
//delete cart item
user_route.post('/deletecart/:id',Auth.userAuth,Auth.checkToBlock,cartControl.deleteCart)
user_route.post('/update-cart/:id',Auth.userAuth,cartControl.incAndDec)
//profile
user_route.get('/profile',Auth.checkToBlock,Auth.userAuth,profileControl.loadProfile)
user_route.post('/profile',Auth.userAuth,upload.single('image'),profileControl.updateProfilePhoto)

user_route.get ('/profile/addAddress',Auth.checkToBlock,Auth.userAuth,profileControl.loadAddAddress)
user_route.post('/profile/addAddress',Auth.checkToBlock,Auth.userAuth,profileControl.addAddress)
user_route.delete("/deleteAddress/:id",Auth.checkToBlock,Auth.userAuth,profileControl.deleteAddress)

//edit address
user_route.get('/user/profile/editaddress',Auth.checkToBlock,Auth.userAuth,profileControl.loadEditAddress)
user_route.post('/user/profile/editaddress',Auth.checkToBlock,Auth.userAuth,profileControl.editAddress)

user_route.get('/product/cart/checkout',Auth.userAuth,cartControl.loadCheckOut)
user_route.post('/product/cart/checkout',Auth.userAuth,Auth.checkToBlock,cartControl.placeOrder)
// razore pay saving
user_route.post('/save-rzporder',Auth.userAuth,Auth.checkToBlock,cartControl.saveRazorepay) 
user_route.get('/address/changeAddress',cartControl.loadchangeAddress)
user_route.post('/address/changeAddress',Auth.userAuth,Auth.checkToBlock,cartControl.changeAddress)

//oreder page
user_route.get('/cart/order',Auth.userAuth,Auth.checkToBlock,cartControl.loadOrder)

//cancel order
user_route.post('/cancel-order',Auth.userAuth,Auth.checkToBlock,cartControl.cancelOrder)
user_route.route("/return-product")
    .get(Auth.checkToBlock, Auth.userAuth, cartControl.getReturnProductForm)
    .post(Auth.checkToBlock,Auth.checkToBlock, cartControl.requestReturnProduct);


//forget password
user_route.get('/forgetPassword',Auth.userloggedout,Controler.loadForgetPass)
user_route.post('/forgetPassword',Auth.userloggedout,Controler.forgetPassword)
user_route.get('/verifyOTPForgetPass',Auth.userloggedout,Controler.loadOTPForgetPassPage)
user_route.post('/verifyOTPForgetPass',Auth.userloggedout,Controler.verifyOTPForgetPassPage)
user_route.post('/changePass',Auth.userloggedout,Controler.changepass)

user_route.get('/user/wallet',Auth.userAuth,Auth.checkToBlock,cartControl.getWallet)

module.exports = user_route