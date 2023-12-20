const express = require('express')
const User = require('../../Models/userModel')


const displayUser = async(req,res) =>{
    try{
    const users = await User.find({is_varified:true, is_Admin: false})
    res.render('admin/userDetails',{ users })
}catch(error){
    console.log(error.message);
}
}

const blockUser = async (req, res) => {
    try {
      const { id } = req.query;
      const userupdate = await User.updateOne(
        { _id: id },
        { $set: { is_block: true } }
      );
      if (userupdate) {
        res.redirect("/admin/userLogs");
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  const unblockUser = async (req, res) => {
    try {
      const { id } = req.query;
      console.log(id);
  
      const userupdate = await User.updateOne(
        { _id: id },
        { $set: { is_block: false } }
      );
      console.log(userupdate);
      if (userupdate) {
        res.redirect("/admin/userLogs");
      }
    } catch (error) {
      console.log(error.message);
    }
  };

module.exports = {
    displayUser,
    blockUser,
    unblockUser
}