const express = require("express");
const User = require("../../Models/userModel");

const product = require("../../Models/productModel");
const Order = require('../../Models/orderModel');
const Return = require("../../Models/returnProductModel");
const { editproduct } = require("./productControl");
const Coupon = require('../../Models/couponModel')


const loadOrder = async (req, res) => {
    const perPage = 8; // Number of orders per page
    const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)

    const { customer, status } = req.query;

    try {
        let ordersQuery = Order.find().populate([{ path: 'products.product' }, { path: 'user' }])

        if (customer) {
            ordersQuery = ordersQuery.where('user.userName').regex(new RegExp(customer, 'i'));
        }

        if (status) {
            ordersQuery = ordersQuery.where('status').equals(status);
        }

        const orders = await ordersQuery
            .sort({ orderDate: -1 }) // Sort by orderDate in descending order
            .skip((page - 1) * perPage) // Skip orders on previous pages
            .limit(perPage); // Limit the number of orders per page

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / perPage);
        console.log("sddddddddddd",page);
        res.render("admin/order", {
            activePage: "order",
            orders,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
       console.log(error.message);
    }
}


const updateActionOrder = async (req, res) => {
        try{
            const order = await Order.findById(req.query.orderId)
            const userData = await User.findById(order.user)


            if(req.query.action === "Delivered"){
                const findCoupon = await Coupon.findOne({
                    isActive:true, minimumPurchaseAmount:{$lte:order.totalAmount}
                }).sort({minimumPurchaseAmount: -1});

                if(findCoupon){
                    //to check contain any  coupon id on user data 
                    //some is used for true or false
                    const couponExists  = userData.earnedCoupons.some((coupon) => coupon.coupon.equals(findCoupon._id))
                    if(!couponExists){
                        //if not foud it will push the id to earnedcoupon
                        userData.earnedCoupons.push({coupon:findCoupon._id})
                    }
                    await userData.save();
                }
            }


            await Order.updateOne({_id: req.query.orderId},{status: req.query.action})
            res.redirect("/admin/order")
        }catch(error){
            console.log(error.message);
        }
}


const getReturnRequests = async (req, res) => {
    try{
    const ITEMS_PER_PAGE = 10;  // Define the number of items to display per page
    const page = parseInt(req.query.page) || 1; // Extract the page from the query string
    const totalRequests = await Return.countDocuments(); // Count the total number of return requests
    const returnRequests = await Return.find()
    .populate([
        { path: 'user' },
        { path: 'order' },
        { path: 'product' },
        { path: 'address'}
    ])
    .skip((page - 1) * ITEMS_PER_PAGE) // Calculate the number of items to skip
    .limit(ITEMS_PER_PAGE); // Define the number of items to display per page
    // console.log("hkkkkkkkkkk",returnRequests);
    const totalPages = Math.ceil(totalRequests / ITEMS_PER_PAGE);
   console.log(page);
    res.render('admin/returns',{
        activePage:"order",
        returnRequests,
        totalPages,
        currentPage: page 
    });

}catch(error){
    console.log(error.message);
}
}


const returnRequestAction = async (req, res, next) => {
    try{
        const foundRequet = await Return.findById(req.body.request);
        const foundOrders = await Order.findById(req.body.order);
        const currentProduct = foundOrders.products.find((product) => product.product.toString() === req.body.product.toString());
        if(req.body.action === "approve"){
            foundRequet.status = "Approved";
            currentProduct.returnRequested = 'Approved';
        }else if(req.body.action === "Rejected"){

            foundRequet.status = "Rejected";
            currentProduct.returnRequested = "Rejected"
        }else{
            console.log(foundOrders.totalAmount);
            const currentUser = await User.findById(foundOrders.user)

            const EditProduct = await product.findOne({_id: req.body.product})

            const currentStock = EditProduct.stock_count;
            // console.log("start",currentStock);
            EditProduct.stock_count = currentStock + foundRequet.quantity;
            // console.log("end",currentStock);
            await EditProduct.save();
            //for adding wallet
            // Save changes to the user's wallet, canceled product, and order
            console.log("foundOrders.totalAmount",foundOrders.totalAmount);
          const refundamount = foundOrders.totalAmount
        //     currentUser.wallet.balance = refundamount;
            const testcase = await User.updateOne(
                { _id: req.session.user },
                { $inc: { 'wallet.balance': refundamount } }
              );
                const transactionData = {
                    amount: refundamount,
                    description: "Returned Product",
                    type: 'Credit',
                }
              currentUser.wallet.transactions.push(transactionData)
            // console.log(currentUser);
            // console.log('currentUser.wallet.balance',testcase);
            foundRequet.status = 'Completed';
            currentProduct.returnRequested = 'Completed';
            await currentUser.save();
        }
        await foundRequet.save();
        await foundOrders.save();
        
        res.redirect('/admin/return-requests');
    }catch(error){
        console.log(error.message);
    }


}


const updateOrderCancel = async (req,res) => {
    try{
        const products = await product.findById(req.query.orderId)
        const foundOrder = await Order.findById(req.query.orderId)
        const currentUser  = await User.findById(req.session.user)
        // console.log("bf",foundOrder.products[0].quantity);
        for (let i = 0; i < foundOrder.products.length; i++) {
            
            foundOrder.products[i].isCancelled = true
            if(foundOrder.paymentMethod === 'wlt' && foundOrder.products[i].isCancelled === true){
       
                 const refundamount = foundOrder.totalAmount
        //     currentUser.wallet.balance = refundamount;
            const testcase = await User.updateOne(
                { _id: req.session.user },
                { $inc: { 'wallet.balance': refundamount } }
              );

              const transactionData = {
                amount: refundamount,
                description: 'Order cancelled.',
                type: 'Credit',
            };
            currentUser.wallet.transactions.push(transactionData);

            // Save changes to the user's wallet, canceled product, and order
            await currentUser.save();

             }

            if(foundOrder.paymentMethod === 'wlt' || foundOrder.paymentMethod === 'cod' && foundOrder.products[i].isCancelled === true) {
                
                foundOrder.totalAmount -= foundOrder.totalAmount;
                if (foundOrder.totalAmount === 5) {
                    foundOrder.totalAmount = 0;
                  }
                 const num =  foundOrder.products[i].quantity
                 
                 await product.updateOne({ _id:foundOrder.products[i].product  }, { $inc: { stock_count: num } })
             
     

            }
        }
        
        
        foundOrder.status = req.query.action

        await foundOrder.save()

           res.redirect("/admin/order")
    }catch(error){
        console.log(error.message);
    }
}



const loadSalesReport = async(req,res)=>{
    try{
        
        let startOfMonth;
        let endOfMonth;
       
        if(req.query.filtered){
            console.log("req.body.form");
        console.log("req.body.form",req.body.from);
        console.log("req.body.upto",req.body.upto);
            startOfMonth = new Date(req.body.from);
            endOfMonth = new Date(req.body.upto);
            endOfMonth.setHours(23, 59, 59, 999);

        }else{
            const today = new Date();
            startOfMonth = new Date(today.getFullYear(),today.getMonth(), 1);
            endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        var orderStatusFilter = {status: {$in: ["Processing","Shipped","Cancelled","Delivered"]}}
         // Check if order status is provided in the request
         if (req.body.status) {
            if (req.body.status === "Cancelled") {
                orderStatusFilter = { "products.isCancelled": true };
            } else if (req.body.status === "Returned") {
                orderStatusFilter = { "products.returnRequested": "Completed" };
            } else {
                orderStatusFilter = {
                    status: req.body.status,
                    "products.isCancelled": { $ne: true },
                    "products.returnRequested": { $ne: "Completed" },
                };
            }
         }

        const filteredOrders = await Order.aggregate([
            {
                $unwind: "$products" // Unwind the products array
            },
            {
                $match: {
                    // status: "Delivered",
                    orderDate: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    },
                    ...orderStatusFilter
                }
                  // Use the complete orderStatusFilter object
            },
            {
                $lookup: {
                    from: "products", // Replace with the actual name of your products collection (clarify it)
                    localField:"products.product",
                    foreignField:"_id",
                    as: "productInfo"  // Store the product info in the "productInfo" array
                }
            },
            {
                $addFields: {
                    "products.productInfo": {
                        $arrayElemAt: ["$productInfo", 0]   // Get the first (and only) element of the "productInfo" array

                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $unwind: "$userInfo"
            },
            {
                $project: {
                    _id: 1,
                    productInfo:1,
                    userInfo: 1,
                    totalAmount: 1,
                    paymentMethod: 1,
                    deliveryAddress: 1,
                    status: 1,
                    orderDate: 1,
                    deliveryDate: 1,
                    "products.quantity": 1,
                    "products.total": 1,
                    "products.isCancelled": 1,
                    "products.returnRequested": 1,
                    "products.productInfo": 1

                }
            }
        ])
        let orderDone = 0
        let totalRevenue = 0
        for(let i=0; i<filteredOrders.length; i++){
            if(filteredOrders[i].status === "Delivered" && filteredOrders[i].products.returnRequested !== "Completed") {
                orderDone += 1
                totalRevenue += (filteredOrders[i].products.quantity*filteredOrders[i].products.productInfo.price)
            }
        }
        // console.log("req.body.form");
       
        res.render('admin/salesReport',{
            salesReport: filteredOrders,
            orderDone,
            totalRevenue
        })
    }catch(error){
        console.log(error);
    }
}

module.exports  = { 
    loadOrder,
    updateActionOrder,
    getReturnRequests,
    returnRequestAction,
    updateOrderCancel,
    loadSalesReport
}
