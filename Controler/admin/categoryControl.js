
const productCategory = require('../../Models/categoryModel')


const loadAddCategory = (req, res) => {
    try {
      res.render("admin/addCategory", { message: "" });
    } catch (error) {
      console.log(error.message);
    }
  };


  const addProductCategory = async (req, res) => {
    //!req.body.categoryName is given as name filed in form || !req.file used in multer
    try {
      if (!req.body.categoryName || !req.file ) {
        return res.render("admin/addCategory", {
          message: "All fields must be filled",
        });
      }
      const exist = await productCategory.findOne({
        categoryName: req.body.categoryName,
      }).collation({ locale: 'en', strength: 2 });
      
      if (!exist) {
        const category = new productCategory({
          categoryName: req.body.categoryName,
          description: req.body.description,
          offer: req.body.offer,
          image: {
            data: req.file.buffer,
            contentType: req.file.mimetype,
          },
        });
  
        await category.save();
        return res.redirect("/admin/product/product_Category");
      } else {
        return res.render("admin/addCategory", {
          message: "category already exists",
        });
      }
    } catch (error) {
      console.log(error.message);
      return res.status(500).send("internal server error");
    }
  };
  


  const   loadProductCategory = async (req, res) => {
    try {
      const categories = await productCategory.find().sort({ _id: -1 });
      res.render("admin/productCategory", { categories });
    } catch (error) {
      console.log(error.message);
    }
  };


  const categoryDesable = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
      console.log("1");
      const desable = await productCategory.updateOne(
        { _id: id },
        { $set: { is_desable: true } }
      );
  
      if (desable) {
        res.redirect("/admin/product/product_Category");
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  const categoryunable = async (req, res) => {
    try {
      const { id } = req.params;
      const unable = await productCategory.updateOne(
        { _id: id },
        { $set: { is_desable: false } }
      );
      res.redirect("/admin/product/product_Category");
    } catch (error) {
      console.log(error.message);
    }
  };


const loadEditCategory = async(req,res) =>{
  try{
    const id = req.params.id
    console.log(id);
    const category = await productCategory.findById(id)
    // console.log(category);
    if(!category){
      res.render('admin/productCategory',{message:'category not fount'})
    }else{
      res.render('admin/editCategory',{category,message:""})
    }
  }catch(error){
    console.log(error.message);
  }
}


const editCategory = async (req, res) => {
  try {
    const { description, categoryName,offer } = req.body;
    const id = req.params.id; // Extract the ID from req.params
console.log(req.body);
console.log(id);
const category = await productCategory.findById(id)
const exist = await productCategory.findOne({
  categoryName: req.body.categoryName,
  _id: { $ne: req.params.id }, // Exclude the document with the specified ID
}).collation({ locale: 'en', strength: 2 });

if(exist ){
  res.render('admin/editCategory',{category,message:"name already exist"})
}



    const data = {
      categoryName: categoryName,
      description: description,
      offer:offer
    };

    const updateCategory = await productCategory.findByIdAndUpdate(id, { $set: data }, { new: true });

   await updateCategory.save()

    res.redirect('/admin/product/product_Category');
  } catch (error) {
    console.log(error.message);
  }
}


  module.exports = {
    loadAddCategory,
    addProductCategory,
    loadProductCategory,
    categoryDesable,
    categoryunable,
    loadEditCategory,
    editCategory
  }