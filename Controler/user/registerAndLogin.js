const express = require('express')
const User = require('../../Models/userModel')
const bcrypt = require('bcrypt')
const sendMail = require('../../utils/sendMail')
const userOTP = require('../../Models/userOTPModel')
const nodeMailer = require("nodemailer")


let salt;

async function generateSalt() {
    salt = await bcrypt.genSalt(10)
}

generateSalt();


const securePassword = async (password) => {

    try {

        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;

    } catch (error) {
        res.render("error/internalError", { error })
    }

}


const loadhome = async(req,res) =>{
    const session =req.session.user
    try{
        res.render('user/home',{session})
    }catch(error){
        console.log(error.message);
    }
}

const loadRegiser = (req,res) =>{
    try{
        res.render('user/userRegister')
    }catch(error){
        console.log(error.message);
    }
}

const loadLogin = (req,res) =>{
    try{
        res.render('user/userLogin')
    }catch(error){
        console.log(error.message);
    }
}



const insertUser = async (req,res,next) => {
    try{
    const {email,username,phone,password,confirmPassword} = req.body;
    if(email && username && phone && password && confirmPassword){
        const foundUser = await User.findOne({$or:[{userName:username},{email:email}]})

        if(foundUser){
            res.render('user/userRegister',{message:"user already exist"})
        }else{
            if(password=== confirmPassword){
                const hashPassword = await bcrypt.hash(password,salt)
                const newuser = new User({
                    userName:username,
                    email:email,
                    phone:phone,
                    password:hashPassword,
                    is_varified:false
                })

                await newuser.save()
                const savedUser = await User.findOne({userName:username})
                
                // req.session.user = savedUser._id;

                sendMail(req,res,savedUser._id,false)
            }else{
                res.render('user/userRegister',{message:'password and confirm password is not match'})
            }
        }
    }else{
        res.render('user/userRegister',{message:'All fields are require'})
    }

}catch(error){
    next(error)
}
}

const otpVarification = async(req,res) =>{
    try{
        const {OTP,ID} = req.body;
        console.log();
        if(!OTP){
           return res.render('user/verification',{message:"Cannot send empty message",id:ID})
        }
        const OTPrecord = await userOTP.findOne({userId:ID})
        if(!OTPrecord){
            return res.render('user/verification',{message:"Enter valied OTP",id:ID})
        }
        const { expireAt, userId, otp} = OTPrecord;
        if(expireAt<Date.now()){
            await userOTP.deleteOne({userId})
            return res.render('user/verification',{message:'OTP has been expired,Please try again' ,id:ID})
        }
        console.log("11"+OTP,otp);
        const isvalid = await bcrypt.compare(OTP,otp);
        
        console.log("11"+OTP+"helo"+otp);
        if(!isvalid){
            return res.render('user/verification',{message:'The entered OTP is invalid',id:ID})
        }
        await User.updateOne({_id: ID},{$set:{is_varified:true}})
        await userOTP.deleteOne({userId})
        req.session.user = userId._id
        return res.redirect('/userLogin')
    }catch(error){
        console.log(error.message);
        res.status(500).send('Internal Server Error')
    }

}

const uservalidation = async(req,res) =>{
    try{
        const { email, password } = req.body;

        if(!email && !password){
            return res.render('user/userLogin',{message:'Empty field are not allowed'})
        }else if(!/^\S+@\S+\.\S+$/.test(email)){
            return res.render('user/userLogin',{message:'Email is not valied'})
        }else{
            const varifieduser = await User.findOne({email})
            if(!varifieduser){
                return res.render('user/userLogin',{message:'User not found'})
            }else if(varifieduser.is_block === true ){
                return res.render('user/userLogin',{message:'Your Blocked By Admin'})
            }else if(varifieduser.is_varified === true){
                const hashPassword =varifieduser.password;
                const match = await bcrypt.compare(password,hashPassword)
                if(!match){
                    return res.render('user/userLogin',{message:' Invalid Password'})
                }else{
                    req.session.user = varifieduser._id
                    return res.redirect('/')
                }
            }else{
                return res.render('user/userLogin',{message:'Not a Varified User'})
            }
        }
    }catch(error){
        console.log(error.message);
    }
} 

const logout = (req,res)=>{
    try{
        req.session.destroy();
        res.render('user/userLogin')
    }catch(error){
        console.log(error.message);
    }
}

//forget password

const loadForgetPass = (req,res)=>{
    try{
        res.render('user/forgotPassword')
    }catch(error){
        console.log(error.message);
    }
}

const transporter = nodeMailer.createTransport({
    service:'Gmail',
    host: 'smtp.gmail.com',
    port:587,
    secure:false,
    auth:{
        user:process.env.USER,
        pass: process.env.PASS
    }
})

const forgetPassword = async(req,res) =>{
    try{
        const {email} =req.body;
        if(!email){
            res.render("user/forgotPassword",{message:"enter email id"})
        }else{
            const findUser = await User.findOne({email});
            // console.log(findUser);
            if(!findUser){
                res.render("user/forgotPassword",{message:"User not found"})  
            }else{
               if(findUser.email=== req.body.email){
                const otp = `${Math.floor(1000 + Math.random() * 9000)}`
                console.log("jjjjjjjjjjjj",otp);
                const mailOptions ={
                        from:process.env.USER,
                        to:findUser.email,
                        subject: "Verify Your Email",
                    html: `<p>Enter <b>${otp}</b> in the website verify your email address to forget password process</p>
                    <p>This code <b>expire in 1 minutes</b>.</p>`,
                    }
                    const saltRounds = 10
                    const hashedOTP = await bcrypt.hash(otp,saltRounds)
                    const newUserOPTVerification = await new userOTP({
                        userId:findUser._id,
                        otp:hashedOTP,
                        createAt: Date.now(),
                        expireAt: Date.now() + 3600000,
                    })

                    await newUserOPTVerification.save()
                    await transporter.sendMail(mailOptions)

                    res.redirect(`/verifyOTPForgetPass?userId=${findUser._id}`)
                }



               } 
            }
        }catch(error){
            console.log(error.message);
        }  
}


const loadOTPForgetPassPage = async (req, res) => {

    try {

        res.render("user/forgetPassOTP", { userId: req.query.userId })

    } catch (error) {
        console.log(error.message);
    }

}

const verifyOTPForgetPassPage = async (req,res) =>{
    try{
        let { otp ,userId} = req.body;
        if(!otp || !userId){
            console.log(userId);
            res.render('user/forgetPassOTP',{message:"Empty details are not allowed",userId})
        }else{
            const UserOTPVerificationRecords = await userOTP.find({userId})
            console.log("here",);
            if(UserOTPVerificationRecords.length <=0){
                 //no record found
                res.render("user/forgetPassOTP",{message:"Account does not exist",userId})

            }else{
                 //user otp records exists
                 const { expireAt } = UserOTPVerificationRecords[0]
                 const hashedOTP = UserOTPVerificationRecords[0].otp

                 if(expireAt <Date.now()){
                     //user otp records has expires
                     await userOTP.deleteMany({userId})
                     res.render("user/forgetPassOTP", { message: "Code has expires. Please request again.", userId })

                 }else{
                    const validOTP = await bcrypt.compare(otp,hashedOTP)
                    if(!validOTP){
                        //supplied otp is wrong
                        res.render("user/forgetPassOTP", { message: "Invalid OTP. Check your Email.", userId })

                    }else{
                        //success
                        await userOTP.deleteMany({userId})
                        res.render("user/changePassword",{userId})
                    }
                 }
            }
        }
    }catch(error){
        console.log(error.message);
    }
}

const changepass = async (req,res) => {
    try{
        let {userId,password} =req.body
        if(!userId || !password){
            res.render('user/changePassword',{message:`Empty password is not allowed`, userId})
        }else{
            const UserOTPVerificationRecords = await User.find({ _id:userId })

            if(UserOTPVerificationRecords.length <= 0){
                //no record found
                res.render("user/changePassword",{message:`Account record doesn't exist . Please sign up`, userId})
            }else{
                //success
                const spassword = await securePassword(password)
                await User.updateOne({_id:userId},{$set: {password:spassword}})
                await userOTP.deleteMany({userId})
                res.render("user/userLogin",{ message:"password changed"})
            }
        }
    }catch(error){
        console.log(error.message);
    }
}

 
module.exports = {
    loadhome,
    loadRegiser,
    loadLogin,
    insertUser,
    otpVarification,
    logout,
    uservalidation,
    loadForgetPass,
    forgetPassword,
    loadOTPForgetPassPage,
    verifyOTPForgetPassPage,
    changepass

}