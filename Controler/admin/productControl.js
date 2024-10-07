const express = require("express");
const User = require("../../Models/userModel");
const productCategory = require("../../Models/categoryModel");
const product = require("../../Models/productModel");

const loadaddproduct = async (req, res) => {
  try {
    const Categories = await productCategory.find({});
    // console.log(Categories);
    return res.render("admin/addProduct", { message: "", Categories });
  } catch (error) {
    console.log(error.message);
  }
};






const addproduct = async (req, res) => {
  try {
    // console.log("add product");
    // console.log(req.body);
    const Categories = ({
      productName,
      brandName,
      price,
      description,
      stockCount,
      category,
      offer,
      inStock,
    } = req.body);
    if (
      !productName ||
      !brandName ||
      !price ||
      !description ||
      !stockCount ||
      !offer
    ) {
        // console.log("dkjf");
        // console.log(Categories);
      return res.render("admin/addProduct", {
        message: "fill all the fields",
        Categories,
      });
      
    }
   
    let stock;
    if (stockCount>0) {
      stock = true;
    } else {
      stock = false;
    }
    // console.log("Product  .");
    //create the product

    const createdproduct = new product({
      product_name: productName,
      brand_name: brandName,
      price: price,
      stock_count: stockCount,
      description: description,
      category: category,
      in_stock: stock,
      offer:offer
    });
    // console.log(req.files);
    req.files.forEach((file) => {
      createdproduct.images.push({
        data: file.buffer,
        contentType: file.mimetype,
      });
    });
    // console.log(createdproduct.images);

    await createdproduct.save();

    if (createdproduct) {
      console.log("product added success fully");
      res.redirect("/admin/product/productlist");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadProductList = async (req, res) => {
  try {
    const products = await product.find().populate('category')

    
    // console.log(products);
    if (products) {
      res.render("admin/products", { products });
    } else {
      console.log("product not found");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadedit = async (req, res) => {
    try {
      const id = req.params.id;
      const products = await product.findById(id);
      //change it last
      const categories = await productCategory.find({
      //   categoryName: { $ne: products.category },
      });
      res.render("admin/editproduct", { message: "", products, id, categories });
    } catch (error) {
      console.log(error.message);
    }
  };


  const editproduct = async (req, res) => {
    const {
      productName,
      brandName,
      price,
      description,
      stockCount,
      category,
      offer,
      id,
    } = req.body;

    try {
      const productId = id;
      const data = {
        product_name: productName,
        brand_name: brandName,
        price: price,
        stock_count: stockCount,
        description: description,
        category: category,
        offer:offer
      };

      const updatedproduct = await product.findByIdAndUpdate(
        productId,
        { $set: data },
        { new: true }
      );

      if (req.files && req.files.length > 0) {
        // Assuming 'req.files' contains the uploaded image files
        req.files.forEach((file) => {
          updatedproduct.images.push({
            data: file.buffer,
            contentType: file.mimetype,
          });
        });
      }

      await updatedproduct.save();
      res.redirect("/admin/product/productlist");
    } catch (error) {
      console.log(error.message);
      // Handle the error appropriately
      res.status(500).send("Error updating product");
    }
};



  const productActivate = async(req,res) =>{
    try{
        const {id} = req.params;
        const active =await product.updateOne({_id:id},{$set:{is_delete:false}})
        if(active){
        res.redirect('/admin/product/productlist')
        }
    }catch(error){
        console.log(error.message);
    }
}

const productDesable = async(req,res) =>{
    try{
        const {id} =req.params;
        const deactive = await product.updateOne({_id:id},{$set:{is_delete:true}})
        if(deactive){
        res.redirect('/admin/product/productlist')
        }
    }catch(error){
        console.log(error.message);
    }
}


const loadShop = async (req, res) => {
  try {
    let cartnum;
    if(req.session.user){
      cartnum = await User.findById(req.session.user)
      //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
          }
      const session = req.session.user;
      const perPage = 4; // Number of products per page
      const page = parseInt(req.query.page) || 1; // Get the current page from query parameters (default to page 1)

      // Calculate the number of documents to skip based on the current page
      const skip = (page - 1) * perPage;

      // Fetch products with pagination
      const products = await product
          .find({ is_delete: false, in_stock: true, stock_count: { $gte: 1 }, price: { $gte: 1 } })
          .skip(skip)
          .limit(perPage).populate("category")

      // Count total number of products to calculate total pages
      const totalProducts = await product.countDocuments({ is_delete: false, in_stock: true, stock_count: { $gte: 1 }, price: { $gte: 1 } });
      const totalPages = Math.ceil(totalProducts / perPage);
     
      const brands= await product.find({ is_delete: false, in_stock: true, stock_count: { $gte: 1 }, price: { $gte: 1 } })
// console.log("ssdas",brands);

      // Fetch product categories
      const category = await productCategory.find();
      // console.log("category",category);
      // Pass pagination information to the view
      res.render('user/shop', { session, cartnum, brands, products, category, currentPage: page, totalPages });
  } catch (error) {
      console.log(error.message);
  }
};



const productDetails = async(req,res) => {
    try{
        const session =req.session.user;
        let cartnum;
        if(req.session.user){
          cartnum = await User.findById(req.session.user)
              }
        const { id } = req.params;
        const details = await product.findById({ _id:id }).populate('category')
        if(details){
            res.render('user/productDetails',{details,session,id,cartnum})
        }

    }catch(error){
        console.log(error.message);
    }

}


const deleteImgDelete = async (req, res) => {
  const id = req.params.id
  const imageId = req.params.imageId
  console.log(id + "here" + imageId);
  try {
      const deleteimg = await product.findByIdAndUpdate(
          { _id: id },
          { $pull: { "images": { _id: imageId } } },
          { new: true }
      );

      // 650c7fbf086081c38a
      if (deleteimg) {

          // console.log(deleteimg)
          return res.redirect(`/admin/product/${req.params.id}/Edit`)
      }
  } catch (error) {
      console.log(error.message)
  }
}


const searchProducts = async (req, res) => {
  try {
    const session = req.session.user;
    let cartnum;
    if (req.session.user) {
      cartnum = await User.findById(req.session.user);
    }

    const page = parseInt(req.query.page) || 1; // Use the page parameter from the request query or default to page 1
    const pageSize = 10; // Number of products to show per page

    const query = {
      is_delete: false,
      $or: [
        { product_name: { $regex: req.body.product, $options: "i" } },
        { description: { $regex: `\\b${req.body.product}\\b`, $options: 'i' } },
        // { category: { $regex: req.body.product, $options: "i" } },
      ],
    };

    const count = await product.countDocuments(query);
    const totalPages = Math.ceil(count / pageSize);

    const foundProducts = await product
      .find(query)
      .populate('category')
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const brands = await product.find({
      is_delete: false,
      in_stock: true,
      stock_count: { $gte: 1 },
      price: { $gte: 1 },
    });

    const findCategories = await productCategory.find({ is_desable: false });

    res.render('user/Shop', {
      session,
      products: foundProducts,
      category: findCategories,
      currentPage: page,
      totalPages,
      brands,
      cartnum,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};



const filterByCategory = async (req, res) => {
  try {
      const session = req.session.user;
      let cartnum;
      if (req.session.user) {
          cartnum = await User.findById(req.session.user);
      }

      let filterQuery = {
          is_delete: false,
          in_stock: true,
          stock_count: { $gte: 1 },
          price: { $gte: 1 },
      };

      if (req.query.category) {
          filterQuery.category = req.query.category;
      }

      const currentPage = parseInt(req.query.page) || 1;
      const perPage = 4; // Set the number of products to display per page

      const skip = (currentPage - 1) * perPage;

      const products = await product
          .find(filterQuery)
          .populate('category')
          .skip(skip)
          .limit(perPage);

      const totalProducts = await product.countDocuments(filterQuery);
      const totalPages = Math.ceil(totalProducts / perPage);

      const brands = await product.find({
          is_delete: false,
          in_stock: true,
          stock_count: { $gte: 1 },
          price: { $gte: 1 },
      });

      const category = await productCategory.find();

      res.render('user/shop', {
          session,
          brands,
          products,
          category,
          currentPage,
          totalPages,
          cartnum,
      });
  } catch (error) {
      console.log(error.message);
  }
};

  

module.exports = {
  addproduct,
  loadaddproduct,
  loadProductList,
  loadedit,
  editproduct,
  productActivate,
  productDesable,
  loadShop,
  productDetails,
  deleteImgDelete,
  searchProducts,
  filterByCategory,
 
};
