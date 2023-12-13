const express = require('express')
const session = require('express-session')
const User = require('../Models/userModel')

const userloggedout = (req,res,next) =>{
   try{
    if(req.session.user){
        res.redirect('/')
    }else{
        next()
    }

   }catch(error){
    console.log(error.message);
   }
}

const userAuth = (req,res,next) => {
    try{
        if(req.session.user){
            next()
        }else{
            res.redirect('/')
        }
    }catch{
        console.log(error.message)
    }
}

// adminside Auth

const adminAuth = (req,res,next) =>{
    try{
        if(req.session.admin){
            next()
        }else{
            res.render('admin/adminLogin',{message:""})
        }
    }catch(error){
        console.log(error.message);
    }
}

const adminLogout = (req,res,next) =>{
    try{
        if(!req.session.admin){
            next()
        }else{
            res.render('admin/dashboard')
        }
    }catch(error){
        console.log(error.message);
    }
} 


const checkToBlock=async (req,res,next)=>{
    const currentUser=await User.findById(req.session.user)
    if(currentUser && currentUser.blocked===true){
        req.session.user=null
    }
    next()
}

module.exports ={
    userAuth,
    userloggedout,
    adminAuth,
    adminLogout,
    checkToBlock
}