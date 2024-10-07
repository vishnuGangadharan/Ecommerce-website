const User = require('../../Models/userModel')

const getAbout = async(req,res) =>{
    
    try{
        const session  = req.session.user
        let cartnum;
        if(req.session.user){
          cartnum = await User.findById(req.session.user)
              }
        res.render('user/about',{session,cartnum})
    }catch(error){
        console.log(error);
    }
}

const getContact = async(req,res) =>{
    try{
        const session  = req.session.user
        let cartnum;
        if(req.session.user){
          cartnum = await User.findById(req.session.user)
              }
        res.render('user/contact',{session,cartnum})
    }catch(error){
        console.log(error);
    } 
    }



module.exports = {
    getAbout,
    getContact
}