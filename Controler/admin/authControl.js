const express = require('express')
const User = require('../../Models/userModel')
const bcrypt = require('bcrypt')



const dashboard = (req,res) =>{
    try{
        res.render('admin/dashboard')
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
                   return res.render('admin/dashboard')
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
    logoutAdmin

}