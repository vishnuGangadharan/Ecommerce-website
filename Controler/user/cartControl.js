const express = require("express");
const User = require("../../Models/userModel");
const Product = require("../../Models/productModel");
const Address = require("../../Models/userAddressModel");
const productCategory = require("../../Models/categoryModel");
const Order = require("../../Models/orderModel");
const { default: mongoose } = require("mongoose");
const Return = require('../../Models/returnProductModel')
const Razorpay = require('razorpay')
const dotenv = require('dotenv');
const product = require("../../Models/productModel");
dotenv.config();
const Coupon = require("../../Models/couponModel")

// const product = require("../../Models/productModel");

const loadCart = async (req, res) => {
  let cartnum;
  if(req.session.user){
    cartnum = await User.findById(req.session.user)
    //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
        }
  const session = req.session.user;
  const user = await User.findById(req.session.user).populate("cart.product");
  console.log(user.cart);
  try {
    console.log("rrrrrrrrrrrrrrrrrrrrrr" + user.cart.length);
    if (user.cart.length === 0) {
      res.render("user/shopingCart", {
        session,
        cart: user.cart,
        grandTotal: user.grandTotal,
        message: "Your Cart is Empty",
        cartnum
      });
    } else {
      res.render("user/shopingCart", {
        session,
        cart: user.cart,
        grandTotal: user.grandTotal,
        cartnum
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addCart = async (req, res) => {
  try {
    
    const id = req.params.id;
    const userId = req.session.user;
    const quantity = 1;
    const product = await Product.findById(id);

    const user = await User.findById(userId).populate("cart.product");
    const totalAmount = product.price * quantity;

    const exist = user.cart.find((c) => c.product._id.toString() == id);
    if (exist) {
       if (exist.quantity === product.stock_count) {
        
        throw new Error("Quantity must be at least 1.");
      }
      exist.quantity = exist.quantity + 1;
      exist.totalAmount = product.price * exist.quantity;
    } else {
      user.cart.push({ product: id, quantity, totalAmount });
    }

    let totalCartValue = 0;
    user.cart.forEach((item) => {
      totalCartValue += item.totalAmount;
    });
    console.log(totalCartValue);
    user.grandTotal = totalCartValue;
    await user.save();
    res.status(200).json("");
  } catch (error) {
     res.status(400).json("");
    console.log(error.message);
  }
};

const deleteCart = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(req.session.user);
    const exist = user.cart.findIndex((c) => c.product._id.toString() == id);
    let find = user.cart.find((c) => c.product._id.toString() == id);
    user.grandTotal = user.grandTotal - find.totalAmount;
    console.log(user.grandTotal);
    user.cart.splice(exist, 1);
    await user.save();
    res.status(200).json({
      grandTotal: user.grandTotal,
      cartLength: user.cart.length,
    });
  } catch {
    res.render("user/500");
  }
};

const incAndDec = async (req, res) => {
  try {
    console.log(req.body);
    const user = await User.findById(req.session.user);
    const cart = user.cart.find(
      (c) => c.product._id.toString() === req.params.id
    );
    if (cart) {
      const product = await Product.findById(cart.product);
      
      if (req.body.type === "increment") {
        console.log(product.stock_count);
        if (cart.quantity + 1 > product.stock_count) {
          return res.status(400).json({ message: "Insufficient stock." });
        } else {
          cart.quantity = cart.quantity + 1;
          cart.totalAmount = product.price * cart.quantity;
        }
      } else {
        if (cart.quantity !== 1) {
          cart.quantity--;
          cart.totalAmount = product.price * cart.quantity;
        }
      }
      let insufficientStock = false;
      if (product.stock_count < cart.quantity) {
        insufficientStock = true;
      }
      let totalCartValue = 0;
      user.cart.forEach((item) => {
        totalCartValue += item.totalAmount;
      });
      user.grandTotal = totalCartValue;
      await user.save();
      return res.status(200).json({
        message: "Success",
        quantity: cart.quantity,
        totalPrice: cart.totalAmount,
        grandTotal: user.grandTotal,
        insufficientStock,
      });
    } else {
      return res
        .status(404)
        .json({ message: "Product not found in the user's cart." });
    }
  } catch {
    res.render("user/500");
  }
};

const loadCheckOut = async (req, res) => {
  const session = req.session.user;
  let cartnum;
  if(req.session.user){
    cartnum = await User.findById(req.session.user)
    //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
        }
  try {
    const user = await User.findById(session);
    const defaultAddress = await Address.findOne({
      userId: session,
      default: true,
    });

    // console.log(address);
    // console.log(cartItem);

    await user.populate("cart.product")
    await user .populate({ path: "cart.product", populate: { path: "category" } })
    
    // await user.populate("cart.product.category")
    // console.log(user);
    const cartProducts = user.cart;
    // console.log(cartProducts);
    const grandTotal = cartProducts.reduce((total, element) => {
      return total + element.quantity * element.product.price;
    }, 0);

  
  
  const totalProductOffer = cartProducts.reduce((total, element) => {
    let productOffer = element.product.offer || 0;
    let categoryOffer = element.product.category && element.product.category.offer || 0;

    // Check if both product and category have offers
    // if (productOffer > 0 && categoryOffer > 0) {
        // Apply the larger of the two offers
    //     maxOfferPercentage = Math.max(productOffer, categoryOffer);
    // } else {
        // Apply the available offer (it could be either product or category)
        maxOfferPercentage = Math.max(productOffer, categoryOffer);
    // }

    // Assuming maxOfferPercentage is the largest of product and category offer percentages
    if (maxOfferPercentage > 0 ) {

        const discountPercentage = maxOfferPercentage;
        const discountedPrice = element.product.price * (1 - discountPercentage / 100);
        total += element.quantity * discountedPrice;
    }

    console.log("maxOfferPercentage", maxOfferPercentage);
    console.log("element.quantity", element.quantity);

    return total;
}, 0);




  console.log('totalProductOffer',totalProductOffer);
console.log("totalProductOffer",totalProductOffer);
    let grossTotal = 0;
    cartProducts.forEach((item) => {
      grossTotal += item.totalAmount;
    });
// console.log("dddddddddddddddddddd",grandTotal);
    res.render("user/checkOut", {
      session,
      user,
      grandTotal,
      discount: 0,
      cartProducts,
      grossTotal,
      currentAddress: defaultAddress,
      errorMessage:"",
      couponError:"",
      currentCoupon:"",
      totalProductOffer,
      cartnum
    });
  } catch (error) {
    console.log(error);
  }
};

const loadchangeAddress = async (req, res) => {
  let cartnum;
  if(req.session.user){
    cartnum = await User.findById(req.session.user)
    //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
        }
  const session = req.session.user;
  try {
    const address = await Address.find({ userId: session });
    // console.log("dfsdffdddddddd");
    // console.log(address);

    res.render("user/changeAddress", { session, address,cartnum });
  } catch (error) {
    console.log(error.message);
  }
};

const changeAddress = async (req, res) => {
  try {
    await Address.updateOne(
      { userId: req.session.user, default: true },
      { $set: { default: false } }
    );

    await Address.findByIdAndUpdate(req.body.addressId, {
      $set: { default: true },
    });
    res.redirect("/product/cart/checkout");
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrder = async (req, res) => {
  try {
    const perPage = 10;
    const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)
    const session = req.session.user;
    let cartnum;
    if(req.session.user){
      cartnum = await User.findById(req.session.user)
      //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
          }
    const currentUser = await User.findById(req.session.user);

    let matchQuery = { user: new mongoose.Types.ObjectId(req.session.user) };

    // Check if status is present in the query parameters
    if (req.query.status) {
      matchQuery.status = req.query.status;
    }

    const order = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "orderedProducts",
        },
      },
      { $sort: { orderDate: -1 } },
    ]).skip((page - 1) * perPage).limit(perPage);

    const totalUserOrders = await Order.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalUserOrders / perPage);

    res.render("user/order", { session, currentUser, order, totalPages,cartnum });
  } catch (error) {
    console.log(error.message);
  }
};




const placeOrder = async (req, res) => {
  try {
   
    let cartnum;
    if(req.session.user){
      cartnum = await User.findById(req.session.user)
      //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
          }
    const currentUser = await User.findOne({ _id: req.session.user });
    
    let usedCoupon = ""; // Default value
    if (req.body.currentCoupon) {
      usedCoupon = currentUser.earnedCoupons.find((coupon)=>coupon.coupon.equals(req.body.currentCoupon));
    }
    console.log("placeoreder",usedCoupon);

    await currentUser.populate("cart.product");
    if(!currentUser.cart.length){
      res.redirect('/cart')
    }


    
    // console.log('llllllllllllllllllllllllllllllllllllll',currentUser.grandTotal);
    const deliveryAddress = await Address.findOne({
      userId: req.session.user,
      default: true,
    });
    const grandTotal = currentUser.cart.reduce((total, element) => {
      return total + element.quantity * element.product.price;
    }, 0);
    // console.log("dddddddddddddddddddddd",currentUser.cart);
    const orderedProduct = currentUser.cart.map((item) => {
      return {
        product: item.product._id,
        quantity: item.quantity,
        total: item.product.price
      };
    });
    let newOrder = new Order({
      user: req.session.user,
      products: orderedProduct,
      totalAmount: req.body.totalAmount,
      paymentMethod: req.body.method,
      deliveryAddress,
    });
// console.log('nefffffffffffffffffffffffffffffffffffffffff',newOrder.totalAmount);
    if (req.body.method === "cod") {
      await newOrder.save();
     console.log("dddddddddd",newOrder.totalAmount);
    } else if(req.body.method== "wlt"){
      // console.log(newOrder.totalAmount ,"fffffff", currentUser.wallet.balance);
      if(  newOrder.totalAmount > currentUser.wallet.balance){
        res.render("user/shop",{session:req.session.user,cartnum, message:'In sufficient balance'})
      }else{
      await newOrder.save()
      await User.updateOne({_id:req.session.user},{$inc:{'wallet.balance':-newOrder.totalAmount}})
      const transactionData = {
        amount: newOrder.totalAmount,
        description: 'Order placed.',
        type: 'Debit',
    };
    console.log("dddddddddd",newOrder.totalAmount);
    currentUser.wallet.transactions.push(transactionData);
    
      }
    }else{
      // console.log('11111111111',process.env.key_id,process.env.key_secret);
    
      const razorpay = new Razorpay({
        key_id:process.env.key_id,
        key_secret:process.env.key_secret,
      })
      // console.log(typeof process.env.key_id);
      const razorpayOrder = await razorpay.orders.create({
        amount:(newOrder.totalAmount + 5) * 100,   // Total amount in paise
        currency: 'INR',// Currency code (change as needed)
        receipt: `${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}${Date.now()}`, // Provide a unique receipt ID
      })
      console.log(razorpayOrder);
      // Save the order details to your database
      newOrder.razorpayOrderId = razorpayOrder.id;
      console.log('razorpayOrder',razorpayOrder);



      return res.render('user/razorepay',{
        order:razorpayOrder,
        key_id:process.env.key_id,
        user:newOrder,
        usedCoupon
      })
    }
   

  
    currentUser.cart.forEach(async (item) => {
      const foundProduct = await Product.findById(item.product._id);
      foundProduct.stock_count -= item.quantity;
      // console.log("after",foundProduct.stock_count);
      await foundProduct.save();
    });
    currentUser.cart = [];
    currentUser.grandTotal = 0;

    console.log("here");
const currentUsedCoupon =  currentUser.earnedCoupons.find((coupon)=>coupon.coupon.equals(req.body.currentCoupon));
console.log('currentUsedCoupongggggggggg',currentUsedCoupon);
if(currentUsedCoupon){
  currentUsedCoupon.isUsed = true;
  await Coupon.findByIdAndUpdate(req.body.currentCoupon, {$inc: { usedCount:1}})
}else{
  console.log("not fount");
}

console.log("2nd");
    await currentUser.save();
    res.redirect("/cart/order");
  } catch (error) {
    console.log(error);
  }
};



const cancelOrder = async (req, res) => {
  try {
    const foundOrder = await Order.findById(req.body.orderId).populate(
      "products.product"
    )
    .populate("products.product.category")
    await foundOrder.populate({ path: "products.product", populate: { path: "category" } })
    // console.log("foundOrder",foundOrder.products[0].product.category);
   

  
    const foundProduct = foundOrder.products.find(
      (order) => order.product._id.toString() === req.body.productId
    );
    console.log("foundOrder",foundProduct.product.category.offer );

    if(foundOrder.paymentMethod !== "cod" && !foundProduct.isCancelled){
      const currentUser = await User.findById(req.session.user);
     
      if(currentUser){
        let productOffer = foundProduct.product.offer || 0;
        let categoryOffer = (foundProduct.product.category && foundProduct.product.category.offer) || 0;
        
        if (productOffer > 0 || categoryOffer > 0) {
          // Calculate refund amount based on the larger offer
          let largerOffer = Math.max(productOffer, categoryOffer);
         
          refundamount = (largerOffer / 100) * foundProduct.product.price * foundProduct.quantity;
        } else {
          // If no offer, use the total amount
          refundamount = foundProduct.total;
        }
       
        console.log("refundamount",refundamount);
        currentUser.wallet.balance +=refundamount;
        const transactionData = {
          amount:refundamount,
          description: 'Order cancelled',
          type :'Credit'
        };
        currentUser.wallet.transactions.push(transactionData)
        // Save changes to the user's wallet, canceled product, and order
        await currentUser.save();
      }else{
        console.log("User not found");
      }
    }

    // console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
// console.log("foundproduct",foundProduct);
     foundProduct.isCancelled = true;

      foundOrder.totalAmount -=
        foundProduct.product.price * foundProduct.quantity;

      if (foundOrder.totalAmount === 5) {
        foundOrder.totalAmount = 0;
      }

     

      const foundCurrentProduct = await Product.findById(req.body.productId);

      if (foundCurrentProduct && foundProduct.isCancelled) {
        foundCurrentProduct.stock_count += foundProduct.quantity;
        await foundCurrentProduct.save();
      }
    

    function areAllProductsCancelled(order) {
      for (const product of order.products) {
        if (!product.isCancelled) {
          return false;
        }
      }
      return true;
    }

    if (areAllProductsCancelled(foundOrder)) {
      foundOrder.status = "Cancelled";
    }

    await foundOrder.save();
    res.redirect("/cart/order");
  } catch (error) {
    console.log(error);
    // Handle the error appropriately, e.g., send an error response to the client
    res.status(500).send("Internal Server Error");
  }
};

const getReturnProductForm = async (req, res) => {
      try{
        let cartnum;
        if(req.session.user){
          cartnum = await User.findById(req.session.user)
          //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
              }
        const session = req.session.user
        const currentUser = await User.findById(req.session.user) 
        
         const product = await Product.findById(req.query.product);
        //  console.log("fffffffffffff",product.product_name);
        //  const category = await productCategory.findById(req.query.productCategory)
        //  console.log("fffffffffffffffff",category.categoryName);
        const defaultAddress = await Address.findOne({ userId: req.session.user, default: true });
        //  console.log(defaultAddress);
         res.render("user/returnForm",{
            session,
            cartnum,
            currentUser: currentUser,
            currentAddress:defaultAddress,
            order: req.query.order,
            // category:"",
            product,
            quantity:req.query.quantity,
            activePage: 'Orders',
         })
      }catch(error){
        console.log(error.message);
      }

}


const requestReturnProduct = async (req, res, next) => {
      try{
        const foundOrder = await Order.findById(req.body.order).populate('products.product');
        console.log("dddddddddddddddd",foundOrder);
        const foundProduct = await Product.findOne({ product_name: req.body.product });
        // console.log("ffffffffffffffffffffffffff",foundProduct);
        const returnProduct = new Return({
          user: req.session.user,
          order: foundOrder._id,
          product: foundProduct._id,
          quantity: parseInt(req.body.quantity),
          reason: req.body.reason,
          condition: req.body.condition,
          address: req.body.address
      });
      await returnProduct.save()
      foundOrder.products.forEach((product) => {
        if (product.product._id.toString() === foundProduct._id.toString()) {
            product.returnRequested = 'Pending';
        }
    });
    await foundOrder.save();
    res.redirect("/cart/order");
      }catch(error){
        console.log(error.message);
      }
}


const getWallet = async(req,res) =>{
  try{
    let cartnum;
    if(req.session.user){
      cartnum = await User.findById(req.session.user)
      //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
          }
    const session = req.session.user
    const currentUser = await User.findById(req.session.user)
    currentUser.wallet.transactions.sort((a, b) => b.timestamp - a.timestamp);

    console.log("fffffffffffffffffff",currentUser);
    res.render("user/wallet",{session,currentUser,cartnum})
  }catch(error){
    console.log(error.message);
  }
}


const saveRazorepay = async(req,res) =>{
  try{

    const { transactionId, orderId, usedCoupon } = req.body;
    console.log("hhhhhhhhhhhhhhhhhhhhhh",req.body);
    const amount = parseInt(req.body.amount / 100);
    const currentUser = await User.findById(req.session.user).populate('cart.product');
    const deliveryAddress = await Address.findOne({userId:req.session.user, default:true})
    console.log(transactionId,"  ",orderId);
    if(transactionId && orderId ){
        
// console.log('fffffffffff',currentUser.cart);
      const orderedProducts = currentUser.cart.map((item)=>{
        return {
          product : item.product,
          quantity: item.quantity,
          total:item.totalAmount
        }
      })
      // console.log("111111",orderedProducts);
      let newOrder = new Order ({
        user:req.session.user,
        products:orderedProducts,
        totalAmount:amount,
        paymentMethod: 'Razorepay',
        deliveryAddress
      })
      await newOrder.save()
      // console.log("cccccccccc",newOrder);

      //stock updating
      for(let i=0;i< currentUser.cart.length;i++){
        const changestock = await product.findById(currentUser.cart[i].product)
        await Product.updateOne({_id:changestock._id},{stock_count:changestock.stock_count- currentUser.cart[i].quantity})
        await changestock.save();
      }

      currentUser.cart = [];
      currentUser.grandTotal = 0
      
      console.log("here");
      const currentUsedCoupon =  currentUser.earnedCoupons.find((coupon)=>coupon.coupon.equals(usedCoupon));
      console.log('currentUsedCoupongggggggggg',currentUsedCoupon);
      if(currentUsedCoupon){
        currentUsedCoupon.isUsed = true;
        await Coupon.findByIdAndUpdate(usedCoupon, {$inc: { usedCount:1}})
      }else{
        console.log("not fount");
      }

      await currentUser.save()
      return res.status(200).json({
        message:'order placed successfully'
      })
    }
  }catch(error){
    console.log(error);
  }
}





module.exports = {
  loadCart,
  addCart,
  deleteCart,
  incAndDec,
  loadCheckOut,
  loadchangeAddress,
  changeAddress,
  loadOrder,
  placeOrder,
  cancelOrder,
  getReturnProductForm,
  requestReturnProduct,
  getWallet,
  saveRazorepay
};
