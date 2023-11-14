const express = require("express");
const User = require("../../Models/userModel");
const bcrypt = require("bcrypt");
const productCategory = require("../../Models/categoryModel");
const product = require("../../Models/productModel");
const Order = require('../../Models/orderModel');
const Return = require("../../Models/returnProductModel");


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

            await Order.updateOne({_id: req.query.orderId},{status: req.query.action})
            res.redirect("/admin/order")
        }catch(error){
            console.log(error.message);
        }
}


const getReturnRequests = async (req, res) => {
    try{
    const ITEMS_PER_PAGE = 5;  // Define the number of items to display per page
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
    console.log("hkkkkkkkkkk",returnRequests);
    const totalPages = Math.ceil(totalRequests / ITEMS_PER_PAGE);
    res.render('admin/returns',{
        activePage:"order",
        returnRequests,
        totalPages
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

            const currentUser = await User.findById(foundOrders.user)
            const EditProduct = await product.findOne({_id: req.body.product})

            const currentStock = EditProduct.stock_count;
            console.log("start",currentStock);
            EditProduct.stock_count = currentStock + foundRequet.quantity;
            console.log("end",currentStock);
            await EditProduct.save();
            //for adding wallet
            // Save changes to the user's wallet, canceled product, and order
            // await currentUser;

            foundRequet.status = 'Completed';
            currentProduct.returnRequested = 'Completed';
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
        console.log(foundOrder.products);
        for (let i = 0; i < foundOrder.products.length; i++) {
            
            foundOrder.products[i].isCancelled = true
        }


        foundOrder.status = req.query.action

        await foundOrder.save()

           res.redirect("/admin/order")
    }catch(error){
        console.log(error.message);
    }
}

module.exports  = { 
    loadOrder,
    updateActionOrder,
    getReturnRequests,
    returnRequestAction,
    updateOrderCancel
}
