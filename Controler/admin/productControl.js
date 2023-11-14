const express = require("express");
const User = require("../../Models/userModel");
const bcrypt = require("bcrypt");
const productCategory = require("../../Models/categoryModel");
const product = require("../../Models/productModel");

const loadaddproduct = async (req, res) => {
  try {
    const Categories = await productCategory.find({});
    console.log(Categories);
    return res.render("admin/addProduct", { message: "", Categories });
  } catch (error) {
    console.log(error.message);
  }
};

const addproduct = async (req, res) => {
  try {
    console.log("add product");
    console.log(req.body);
    const Categories = ({
      productName,
      brandName,
      price,
      description,
      stockCount,
      category,
      inStock,
    } = req.body);
    if (
      !productName ||
      !brandName ||
      !price ||
      !description ||
      !stockCount
    ) {
        console.log("dkjf");
        console.log(Categories);
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
    console.log("Product  .");
    //create the product

    const createdproduct = new product({
      product_name: productName,
      brand_name: brandName,
      price: price,
      stock_count: stockCount,
      description: description,
      category: category,
      in_stock: stock,
    });
    console.log(req.files);
    req.files.forEach((file) => {
      createdproduct.images.push({
        data: file.buffer,
        contentType: file.mimetype,
      });
    });
    console.log(createdproduct.images);

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
    const products = await product.find();
    console.log(products);
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


const loadShop = async (req,res) =>{
    try{
        const session = req.session.user;
        const products = await product.find({is_delete:false,in_stock:true,stock_count:{$gte:1},price:{$gte:1}})
        console.log(products);
        const category = await productCategory.find()
        console.log("hiii"+products);
        res.render('user/shop',{session,products,category})
    }catch(error){
        console.log(error.message);
    }
}


const productDetails = async(req,res) => {
    try{
        const session =req.session.user;
        const { id } = req.params;
        const details = await product.findById({ _id:id })
        if(details){
            res.render('User/productDetails',{details,session,id})
        }
        console.log("gdfg"+details);

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
  deleteImgDelete
};
