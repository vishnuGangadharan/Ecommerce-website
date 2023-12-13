const express = require('express')
const User = require('../../Models/userModel')
const Address = require('../../Models/userAddressModel')



const loadProfile = async (req,res) => {
    try{
    const session = req.session.user
    let cartnum;
    if(req.session.user){
      cartnum = await User.findById(req.session.user)
      //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
          }
    const user = await User.findById(req.session.user)
   
    const address = await Address.find({userId:session})
// console.log(address);
    const showAddAddressBTN = address.length < 4;

    if(!user){
        res.status(404).send('User not Found');
    }
        res.render('user/profile',{session,cartnum, user, address, showAddAddressBTN})
    }catch(error){
        console.log(error.message);
    }
}

const updateProfilePhoto = async(req,res) =>{
    const { image } =req.body
    const session = req.session.user
    let cartnum;
    if(req.session.user){
      cartnum = await User.findById(req.session.user)
      //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
          }
    try{
        const user = await User.findByIdAndUpdate(req.session.user,{
            $set: {
                image:{
                    data: req.file.buffer,
                    contentType: req.file.mimetype,
                },
            },
        })

        const address = await Address.find({userId:req.session.user})
        const showAddAddressBTN = address.length < 4;
        res.redirect('/profile')
    }catch(error){
        console.log(error.message);
    }
}


const loadAddAddress = async(req,res)=>{
    try{
    const session = req.session.user
    let cartnum;
    if(req.session.user){
      cartnum = await User.findById(req.session.user)
      //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
          }
    res.render('user/addAddress',{session,cartnum})
    }catch(error){
        console.log(error.message);
}
}

const addAddress = async (req,res) =>{
    const session = req.session.user
    try{
        let cartnum;
        if(req.session.user){
          cartnum = await User.findById(req.session.user)
          //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
              }
        const {name , email, place, post, mobile, pincode, house, district, state, country} = req.body
        const otherAddress = await Address.find({ userId: req.session.user})
        // console.log('-------------'+exist);
        if(otherAddress.length < 4){
           
            const newAddress = new Address({
                userId: req.session.user,
                userName:name,
                email:email,
                mobile:mobile,
                houseName:house,
                place:place,
                post:post,
                postCode:pincode,
                district:district,
                state:state,
                country:country,
                default:(otherAddress.length===0)?true: false
            })
            await newAddress.save();
            res.redirect('/profile')
            // console.log(newAddress);
        }

    }catch(error){
        console.log(error.message);
    }

}


const deleteAddress = async(req,res) =>{
    console.log(req.params.id);
    try{
       const find = await Address.findByIdAndDelete(req.params.id);
   if(!find){
    return res.status(404).json({ error: 'Address not found' });

   }
   return res.status(200).json("");

    }catch(error){
        console.log(error.message);
    }
}

const loadEditAddress = async(req,res) =>{
    const session = req.session.user;
    let cartnum;
    if(req.session.user){
      cartnum = await User.findById(req.session.user)
      //  console.log("jjjjjjjjjjjjj",currentuser.cart.length);
          }

    // console.log('dddddddddddd'+req.query.addressid);
    try{
        const address = await Address.findById(req.query.addressid)
        // console.log("vvvvvvvvvvv"+address);
        res.render('user/editAddress',{session,cartnum, address })

    }
    catch(error){
        console.log(error.message);
    }
}

const editAddress = async (req, res) => {
    console.log("sdsdsd");
    const { name, email, place, post, mobile, pincode, house, district, state } = req.body;
    console.log("sdsdsd");
    try {
        
        
        const result = await Address.updateOne(
            { _id: req.body.addressId },
            {
                $set: {
                    userName: name,
                    email: email,
                    mobile: mobile,
                    houseName: house,
                    place: place,
                    post: post,
                    postCode: pincode,
                    district: district,
                    state: state
                }
            }
        );
        console.log("sdsdsd" +req.body.addressId);
        if (result) {
            console.log(result);
            // The update was successful, redirect to the appropriate page
            res.redirect('/profile');
        } else {
            // Handle the case where the address with the given ID was not found
            res.status(404).send('Address not found');
        }
    } catch (error) {
        console.log(error.message);
        // Handle other potential errors here
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    loadProfile,
    updateProfilePhoto,
    loadAddAddress,
    addAddress,
    deleteAddress,
    loadEditAddress,
    editAddress
}