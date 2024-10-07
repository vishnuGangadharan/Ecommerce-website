const Coupon = require('../../Models/couponModel');
const User = require("../../Models/userModel");
const Address = require('../../Models/userAddressModel')
const Product = require('../../Models/productModel');
const { Types } = require("mongoose");
const { logout } = require("./registerAndLogin");


const showCoupon = async(req,res) =>{
    try{

        const session = req.session.user
        let cartnum;
        if(req.session.user){
          cartnum = await User.findById(req.session.user)
          //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
              }
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
             cartnum
            })
    }catch(error){
        console.log(error);
    }
}


const applyCoupon = async(req,res)=>{
    try{
      
        const currentCouponCode = req.body.coupon.trim();
      
//In JavaScript, the trim() method is used to remove whitespace (spaces, tabs, and line breaks) from both ends of a string.
// Whitespace at the beginning and end of a string is commonly added unintentionally and may cause issues 
//when comparing or working with strings
        const currentCoupon = await Coupon.findOne({code: currentCouponCode});
    //   const currentCoupon = await Coupon.findOne({code:req.body.coupon})
      console.log(currentCoupon);
      const session = req.session.user;
      let cartnum;
      if(req.session.user){
        cartnum = await User.findById(req.session.user)
        //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
            }
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
        cartnum,
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
  
  




  const filter = async (req, res) => {
    try {
        console.log("FormData received on the backend:", req.body);
        const brand = req.body.brand;
        const category = req.body.category;
        const price = req.body.price;

        console.log("brand", brand);
        console.log("price", price);
        console.log("category", category);

        // Pagination parameters
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const perPage = 4; // Adjust as needed

        // Build the aggregation pipeline based on the selected filters
        const aggregationPipeline = [];

// Check if brand is provided and is not 'null'
if (brand && brand !== 'null') {
  // Combine conditions using $and
  aggregationPipeline.push({$match: {$and: [{ brand_name: brand },{ is_delete: false }]}});}

  if (category && category !== 'null') {
    console.log("category", category);

    // Assuming 'category' is an array of category IDs
    const categoryObjectId = new Types.ObjectId(category);
    aggregationPipeline.push({
        $match: {
            $and: [
                { category: categoryObjectId },
                { is_delete: false }
                // Add more conditions if needed
            ]
        }
    });
}

if (price && price !== 'null') {
  // Assuming 'price' is a numerical field in your model
  const priceRange = price.split('-').map(Number);
  aggregationPipeline.push({
      $match: {
          $and: [
              { price: { $gte: priceRange[0], $lte: priceRange[1] } },
              { is_delete: false }
              // Add more conditions if needed
          ]
      }
  });
}


        // Count total number of products to calculate total pages
        const totalProducts = await Product.countDocuments({});
        const totalPages = Math.ceil(totalProducts / perPage);

        // Pagination stages
        const skip = (page - 1) * perPage;
        aggregationPipeline.push({ $skip: skip });
        aggregationPipeline.push({ $limit: perPage });

        // Execute the aggregation pipeline on your Product model
        console.log("dd", aggregationPipeline);
        const products = await Product.aggregate(aggregationPipeline);
        console.log('Found Products:', products.length);

        // Send the filtered products and pagination information as a response
        res.json({
            success: true,
            products,
            pagination: {
                currentPage: page,
                totalPages: totalPages
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};



  

module.exports = {
    showCoupon,
    applyCoupon,
    filter
}
