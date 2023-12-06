const express = require("express");
const Coupon = require('../../Models/couponModel');
const User = require("../../Models/userModel");
const loadAddCoupon = (req,res)=>{
    try{
        res.render('admin/createCoupon',{error:""})
    }catch(error){
        console.log(error);

    }
}

function generateCouponCode() {
    const codeRegex = /^[A-Z0-9]{5,15}$/;
    let code = '';
    while (!codeRegex.test(code)) {
        code = Math.random().toString(36).substring(7);
    }
    return Coupon.findOne({ code }).then(existingCoupon => {
        if (existingCoupon) {
            return generateCouponCode();
        }
        return code;
    });
}



const saveCoupon = async(req,res)=>{
    try{
        const {description, discountType,discountAmount, minimumPurchaseAmount, usageLimit,} = req.body;
        if(!description || !discountType || !discountAmount || !minimumPurchaseAmount || !usageLimit){
            res.render('admin/createCoupon',{error:"all fields are require"})
        }else{
            if(discountType === "percentage" && discountAmount >=100){
                res.render('admin/createCoupon',{error:"discount amount is morethan product price"})
            }else{
                const code = await generateCouponCode()
                const newCoupon = new Coupon({
                    code:code,
                    discountType:discountType,
                    description:description,
                    discountAmount:discountAmount,
                    minimumPurchaseAmount:minimumPurchaseAmount,
                    usageLimit:usageLimit

                })
                await newCoupon.save();
                res.redirect('/admin/showCoupon')
            }
        }
    }catch(error){
        console.log(error);
    }
}



const getCoupons = async(req,res) => {
    try{
        const findCoupon = await Coupon.find({})
        res.render('admin/coupons',{findCoupon})
        console.log(findCoupon);
    }catch(error){
        console.log(error);
    }
}


const couponAction = async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findById({ _id: id });
  
      if (coupon) {
        if (coupon.isActive) {
          await Coupon.findByIdAndUpdate({ _id: id }, { $set: { isActive: false } });
          
        } else {
          await Coupon.findByIdAndUpdate({ _id: id }, { $set: { isActive: true } });
        }
  
        res.redirect('/admin/showCoupon');
      } else {
        // Handle the case where the coupon with the specified ID is not found
        res.status(404).json({ error: 'Coupon not found' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  

module.exports = {
    loadAddCoupon,
    getCoupons,
    saveCoupon,
    couponAction
}