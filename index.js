const express = require('express')
const app = express()
const session = require('express-session')
const mongoose = require('mongoose')
require("dotenv").config();
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const nocache = require('nocache')
const customerRoute = require("./routes/userRoutes")
const adminRoutes = require('./routes/adminRoute')



app.use(morgan('dev'));
app.use(nocache())
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(session({
    secret: '%$534j57rh47hdfgfd37284', // Change this to a strong, unique secret key
    resave: false,
    saveUninitialized: true,
   
}));

app.use("/", customerRoute)
app.use('/admin',adminRoutes)

mongoose
    .connect('mongodb://127.0.0.1:27017/Trends')
    .then(() => console.log("DATABASE CONNECTED"))
    .catch((error) => console.log(error))

    const port = process.env.PORT || 3000;


    app.listen(port,()=>{console.log(`port running on hppt://localhost:${port}`);})