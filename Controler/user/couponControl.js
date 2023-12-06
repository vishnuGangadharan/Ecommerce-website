const express = require("express");
const Coupon = require('../../Models/couponModel');
const User = require("../../Models/userModel");
const Address = require('../../Models/userAddressModel')

const showCoupon = async(req,res) =>{
    try{

        const session = req.session.user
        const userCoupon = await User.findById(session).populate('earnedCoupons.coupon')
        const earnedCoupons = userCoupon.earnedCoupons;
        const foundCoupon = await Coupon.find({isActive:true})

        // Convert the list of earned coupon IDs to an array
        const earnedCouponIds = earnedCoupons.map((coupon)=> coupon.coupon._id.toString());
         // Filter out earned coupons from the active coupons list
        const remainingCoupon = foundCoupon.filter((coupon)=>!earnedCouponIds.includes(coupon._id.toString()));
console.log(foundCoupon);
        res.render('user/coupons',{
             session,
             foundCoupon:remainingCoupon,
             earnedCoupons, 
            })
    }catch(error){
        console.log(error);
    }
}


const applyCoupon = async(req,res)=>{
    try{
      
        const currentCouponCode = req.body.coupon.trim();
        const currentCoupon = await Coupon.findOne({code: currentCouponCode});
    //   const currentCoupon = await Coupon.findOne({code:req.body.coupon})
      console.log(currentCoupon);
      const session = req.session.user;
      const user = await User.findById(session).populate('earnedCoupons.coupon')
      await user.populate('cart.product');
      // await userData.populate('cart.product.category');
      const cartProducts  = user.cart;
      const defaultAddress = await Address.findOne({
        userId: session,
        default: true,
      });
  
      const grandTotal = cartProducts.reduce((total, element) => {
        return total + element.quantity * element.product.price;
      }, 0);
  
      let grossTotal = 0;
      cartProducts.forEach((item) => {
        grossTotal += item.totalAmount;
      });
      let couponError = "";
      let discount = 0;
  if(currentCoupon){
    const fountCoupon = user.earnedCoupons.find(coupon=>coupon.coupon._id.equals(currentCoupon._id))
    if(fountCoupon){
      if(fountCoupon.coupon.isActive){
        if(!fountCoupon.isUsed){
          if(fountCoupon.coupon.discountType === 'fixedAmount'){
            if(fountCoupon.coupon.discountAmount > grandTotal){
              couponError = "Your total is less than coupon amount."
            }else{
              discount = fountCoupon.coupon.discountAmount;
            }
          }else{
            discount = (fountCoupon.coupon.discountAmount / 100)*grandTotal
          }
        }else{
          couponError = fountCoupon.isUsed?  "Coupon already used." : "Coupon is inactive."
        }
      }else{
        couponError = fountCoupon.isUsed ? "Coupon already used." : "Coupon is inactive."
      }
    }else{
      couponError = "Invalid coupon code.";
    }
  }else{
    couponError = "Invalid coupon code.";
  }
  


      res.render("user/checkOut", {
        session,
        user,
        grandTotal,
        cartProducts,
        grossTotal,
        currentAddress: defaultAddress,
        couponError,
        discount,
        currentCoupon : couponError ? "" : currentCoupon._id
      });
  
    }catch(error){
      console.log(error);
    }
  }
  
  
  

module.exports = {
    showCoupon,
    applyCoupon
}
