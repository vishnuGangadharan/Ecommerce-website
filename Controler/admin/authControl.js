const express = require('express')
const User = require('../../Models/userModel')
const bcrypt = require('bcrypt')
const Order = require('../../Models/orderModel')
const product = require('../../Models/productModel')



const dashboard =  async(req,res) =>{
    try {
        const today = new Date();
        // Calculate the start and end dates for this month
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // MongoDB aggregation pipeline to fetch the required data
        const pipeline = [
            {
                $match: {
                    status: {
                        $nin: ["Cancelled"]
                    },
                    orderDate: {
                        $gte: thisMonthStart,
                        $lte: thisMonthEnd,
                    },
                },
            },
            {
                $facet: {
                    todaysOrders: [
                        {
                            $match: {
                                orderDate: {
                                    $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                                    $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                                },
                            },
                        },
                        { $count: 'count' },
                    ],
                    thisMonthsOrders: [
                        { $count: 'count' },
                    ],
                    thisMonthsTotalRevenue: [
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
                    ],
                    totalCustomersThisMonth: [
                        {
                            $group: {
                                _id: '$user',
                            },
                        },
                        { $count: 'count' },
                    ],
                },
            },
        ];

        const pipelineDelivered = [
            {
                $match: {
                    status: {
                        $in: ["Delivered"]
                    },
                    orderDate: {
                        $gte: thisMonthStart,
                        $lte: thisMonthEnd,
                    },
                },
            },
            {
                $facet: {
                    todaysOrders: [
                        {
                            $match: {
                                orderDate: {
                                    $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                                    $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                                },
                            },
                        },
                        { $count: 'count' },
                    ],
                    thisMonthsOrders: [
                        { $count: 'count' },
                    ],
                    thisMonthsTotalRevenue: [
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
                    ],
                    totalCustomersThisMonth: [
                        {
                            $group: {
                                _id: '$user',
                            },
                        },
                        { $count: 'count' },
                    ],
                },
            },
        ];

        const order = await Order.aggregate(pipeline);
        const orderDelivered = await Order.aggregate(pipelineDelivered);


//most selling product
const pipelineMostSoldProducts = [
    {
        $match: {
            status: 'Delivered', // Filter by status "Delivered"
            orderDate: {
                $gte: thisMonthStart,
                $lte: thisMonthEnd,
            },
        },
    },
    {
        $unwind: '$products', // If products are in an array, unwind to destructure each product
    },
    {
        $group: {
            _id: '$products.product', // Group by product ID
            productName: { $first: '$products.productName' }, // Store the product name (adjust field name based on your product schema)
            totalSold: { $sum: '$products.quantity' }, // Count the total quantity sold for each product
            orders: { $push: '$products' }, // Store details of each order for the product
        },
    },
    {
        $lookup: {
            from: 'products', // The name of the product collection
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo',
        },
    },
    {
        $unwind: '$productInfo',
    },
    {
        $project: {
            _id: '$productInfo._id',
            productName: '$productInfo.product_name',
            totalSold: 1,
            orders: 1,
        },
    },
    {
        $sort: { totalSold: -1 }, // Sort by totalSold in descending order
    },
    {
        $limit: 3, // Limit the results to the top 3 products (most sold)
    },
];

const mostSoldProducts = await Order.aggregate(pipelineMostSoldProducts);

console.log('mostSoldProducts',mostSoldProducts);


const pipelineMostSoldCategories = [
    {
      $match: {
        status: 'Delivered',
        orderDate: {
          $gte: thisMonthStart,
          $lte: thisMonthEnd,
        },
      },
    },
    {
      $unwind: '$products',
    },
    {
      $group: {
        _id: '$products.product.category', // Assuming products have a reference to the category
        categoryName: { $first: null }, // Placeholder, as getting the category name directly in this stage is not straightforward
        totalSold: { $sum: '$products.quantity' },
      },
    },
    {
      $lookup: {
        from: 'productcategories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo',
      },
    },
    {
      $unwind: '$categoryInfo',
    },
    {
      $project: {
        _id: '$_id',
        categoryName: '$categoryInfo.categoryName',
        totalSold: 1,
      },
    },
    {
      $sort: { totalSold: -1 },
    },
    {
      $limit: 3,
    },
  ];
  
  console.log('Pipeline before aggregation:', pipelineMostSoldCategories);
  
  const mostSoldCategories = await Order.aggregate(pipelineMostSoldCategories);
  
  console.log('mostSoldCategories', mostSoldCategories);
  
  
  
  
//   const sampleData = await Order.find({ status: 'Delivered' }).populate({
//     path: 'products.product',
//     populate: { path: 'category' },
//   });
  
//   console.log(sampleData);
  
  

        let todaysOrders;
        let thisMonthsDeliveredOrders;
        let thisMonthsTotalRevenue;
        let totalCustomersThisMonth;

        order.forEach((ord) => {
            todaysOrders = ord.todaysOrders[0] ? ord.todaysOrders[0].count : 0;
            totalCustomersThisMonth = ord.totalCustomersThisMonth[0] ? ord.totalCustomersThisMonth[0].count : 0;
        });

        orderDelivered.forEach((ord) => {
            thisMonthsDeliveredOrders = ord.thisMonthsOrders[0] ? ord.thisMonthsOrders[0].count : 0;
            thisMonthsTotalRevenue = ord.thisMonthsTotalRevenue[0] ? ord.thisMonthsTotalRevenue[0].total : 0;
        })

        // for charts
        const orderChartData = await Order.find({ status: 'Delivered' });
        // Initialize objects to store payment method counts and monthly order counts
        const paymentMethods = {};
        const monthlyOrderCountsCurrentYear = {};

        // Get the current year
        const currentYear = new Date().getFullYear();

        // Iterate through each order
        orderChartData.forEach((order) => {
            // Extract payment method and order date from the order object
            let { paymentMethod, orderDate } = order;

            // Count payment methods
            if (paymentMethod) {
                switch (paymentMethod) {
                    case 'Cash on delivery': {
                        paymentMethod = 'cod';
                        break;
                    };
                    case 'Razorpay': {
                        paymentMethod = 'Razorepay';
                        break;
                    };
                    case 'Wallet': {
                        paymentMethod = 'wlt';
                        break;
                    };
                }
                if (!paymentMethods[paymentMethod]) {
                    paymentMethods[paymentMethod] = order.totalAmount;
                } else {
                    paymentMethods[paymentMethod] += order.totalAmount;
                }
            }

            // Count orders by month
            if (orderDate) {
                const orderYear = orderDate.getFullYear();
                if (orderYear === currentYear) {
                    const orderMonth = orderDate.getMonth(); // Get the month (0-11)

                    // Create a unique key for the month
                    const monthKey = `${orderMonth}`; // Month is 0-based

                    if (!monthlyOrderCountsCurrentYear[monthKey]) {
                        monthlyOrderCountsCurrentYear[monthKey] = 1;
                    } else {
                        monthlyOrderCountsCurrentYear[monthKey]++;
                    }
                }
            }
        });

        const resultArray = new Array(12).fill(0);
        for (const key in monthlyOrderCountsCurrentYear) {
            const intValue = parseInt(key);
            resultArray[intValue] = monthlyOrderCountsCurrentYear[key];
        }
        console.log('paymentMethods.Razorepay',paymentMethods.Razorepay);
        console.log('paymentMethods.wlt',paymentMethods.wlt);
        console.log('paymentMethods.cod',paymentMethods.cod);

console.log('resultArray',resultArray);
        res.render('admin/dashboard', {
            todaysOrders,
            thisMonthsDeliveredOrders,
            thisMonthsTotalRevenue,
            totalCustomersThisMonth,
            paymentMethods,
            monthlyOrderCountsCurrentYear: resultArray,
            mostSoldProducts
          
        });
    }catch(error){
        console.log(error.message);
    }
}


const loadLogin = (req,res) =>{
    try{
    res.render('admin/adminLogin',{message:""})
}catch(error){
    console.log(error.message);
}
}

const validAdmin = (req,res,next) =>{
    try{
    const { email, password} =req.body;
    if(!email && !password){
        return res.render('admin/adminLogin',{message:"Credentials needed"})
    }else if(!email){
        return res.render('admin/adminLogin',{message:'Email require'})
    }else if(!password){
        return res.render('admin/adminLogin',{message:"password required"})
    }else{
        next()
    }
      } catch(error){
        console.log(error.message);
      }
    }

const checkAdmin = async(req,res) =>{
    try{
        const { email , password} = req.body;
        const findAdmin = await User.findOne({email})
        if(!findAdmin){
            return res.render('admin/adminLogin',{message:'Admin not found'})
        }else{
            const bpassword = findAdmin.password
            const matchpass = await bcrypt.compare(password, bpassword)
            if(!matchpass){
                return res.render('admin/adminLogin',{message:'Wrong Password'})
            }else{
                if(findAdmin.is_Admin==true){
                    req.session.admin = findAdmin._id;
                   return res.redirect('/admin/dashboard')
                }else{
                    res.render('admin/adminLogin',{message:'Your Not Admin'})
                }
            }
        }
    }catch(error){
        console.log(error.message);
    }
}

const logoutAdmin = (req,res)=>{
    try{
        req.session.destroy();
        res.redirect('/admin/login')
    }catch(error){
        console.log(error);
    }
}











module.exports = {
    dashboard,
    loadLogin,
    validAdmin,
    checkAdmin,
    logoutAdmin,
   
}