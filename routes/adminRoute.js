const express = require('express')
const admin_Routes = express.Router()
const Auth = require('../middileware/Auth')
const authControl = require('../Controler/admin/authControl')
const userData = require('../Controler/admin/userdetailsControl')
const categoryControl = require('../Controler/admin/categoryControl')
const productControl = require('../Controler/admin/productControl')
const orderControl = require('../Controler/admin/orderController')
const couponControl = require('../Controler/admin/couponControl')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage:storage })

const crop = require('../middileware/crop')

admin_Routes.get('/dashboard',Auth.adminAuth,authControl.dashboard)

admin_Routes.get('/login',Auth.adminLogout,authControl.loadLogin)
admin_Routes.post('/login',authControl.validAdmin,authControl.checkAdmin)

admin_Routes.get('/logout',Auth.adminAuth,authControl.logoutAdmin)

admin_Routes.get('/userLogs',Auth.adminAuth,userData.displayUser)
// admin_routes.get('/product/addCategory',Auth.adminAuth)
admin_Routes.get('/user_block',Auth.adminAuth,userData.blockUser)
admin_Routes.get('/user_unblock',Auth.adminAuth,userData.unblockUser)

admin_Routes.get('/product/product_Category',Auth.adminAuth,categoryControl.loadProductCategory)


//category
admin_Routes.get('/category/addCategory',Auth.adminAuth,categoryControl.loadAddCategory)
admin_Routes.post('/category/addCategory',Auth.adminAuth,upload.single('image'),categoryControl.addProductCategory)

admin_Routes.get ('/product/unable/:id',Auth.adminAuth,categoryControl.categoryunable)
admin_Routes.get ('/product/desable/:id',Auth.adminAuth,categoryControl.categoryDesable)

//product
admin_Routes.get('/product/addproduct',Auth.adminAuth,productControl.loadaddproduct)
admin_Routes.post('/product/addproduct',Auth.adminAuth,upload.array('image',3),crop.multiCrop,productControl.addproduct)

admin_Routes.get('/product/productlist',Auth.adminAuth,productControl.loadProductList)
admin_Routes.get('/product/:id/edit',Auth.adminAuth,productControl.loadedit)
admin_Routes.post("/product/edit/:id",upload.array('image'),Auth.adminAuth,productControl.editproduct)
admin_Routes.get("/productlist/:imageId/:id/deleteImg", productControl.deleteImgDelete) 

admin_Routes.get('/product/acivate/:id',Auth.adminAuth,productControl.productActivate)
admin_Routes.get('/product/deactive/:id',Auth.adminAuth,productControl.productDesable)
admin_Routes.get('/category/editCategory/:id',Auth.adminAuth,categoryControl.loadEditCategory)
admin_Routes.post('/category/editCategory/:id',Auth.adminAuth,categoryControl.editCategory)

//order management
admin_Routes.get('/order',Auth.adminAuth,orderControl.loadOrder)
admin_Routes.get('/order/action-update',Auth.adminAuth,orderControl.updateActionOrder)
admin_Routes.get('/order-cancel',Auth.adminAuth,orderControl.updateOrderCancel)
admin_Routes.get('/return-requests',Auth.adminAuth, orderControl.getReturnRequests)
admin_Routes.post('/return-requests',Auth.adminAuth,orderControl.returnRequestAction)

//salesreport
admin_Routes.get("/sales-report",Auth.adminAuth,orderControl.loadSalesReport)
admin_Routes.post("/sales-report",Auth.adminAuth,orderControl.loadSalesReport)


//coupons
admin_Routes.get('/addCoupons',Auth.adminAuth,couponControl.loadAddCoupon)
admin_Routes.get('/showCoupon',Auth.adminAuth,couponControl.getCoupons)
admin_Routes.post('/saveCoupon',Auth.adminAuth,couponControl.saveCoupon)
admin_Routes.get('/couponStatus/:id',Auth.adminAuth,couponControl.couponAction)



module.exports = admin_Routes