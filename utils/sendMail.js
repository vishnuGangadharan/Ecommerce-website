const bcrypt = require('bcrypt')
const nodeMailer = require('nodemailer');
const userOTPVerification = require('../Models/userOTPModel')


let salt;

async function generateSalt() {
    salt = await bcrypt.genSalt(10);
}

generateSalt();


const sendToMail = (req,res, userId,email) =>{
    console.log("mailoption");
    console.log(email);
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

    function generateOTP(length){
        const charset = '0123456789';
        let otp = "";

        for(let i = 0; i<length;i++){
            const randomIndex = Math.floor(Math.random()*charset.length)
            otp += charset[randomIndex]
        }
        return otp
    }

    let OTP = generateOTP(4);

    const mailOptions = {
        from: {
            name:"ex-fam",
            address: process.env.USER,
        },
        to:req.body.email || email,
        subject: 'OTP Verification',
        html: `<p> Your otp for varification is ${OTP} </p>`,
    }
console.log(OTP);
    const sendMail = async (transporter,options) =>{
        try{
            const hashedOTP = await bcrypt.hash(OTP, salt)
            const newUserOPTVerification = new userOTPVerification({
                userId:userId,
                otp:hashedOTP,
                createAt:Date.now(),
                expireAt:Date.now()+ 60000*60
            })
            await newUserOPTVerification.save()
            await transporter.sendMail(options)
            res.render('user/verification',{
                userId,
                email:req.body.mail,
                error:'',
                id:userId,
                refferalCode:req.body.refferalCode
            })
            console.log(email);
        }catch(error){
            res.status(500).json({
                status:"FAILED",
                message:'error sending verification email:'+error.message,
            })
        }
    }
    sendMail(transporter,mailOptions)
}

module.exports = sendToMail;