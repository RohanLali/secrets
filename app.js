//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyparser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields:['password']});

const User = new mongoose.model("User",userSchema);

app.get("/", function(req,res){
    res.render("home");
})

app.get("/login", function(req,res){
    res.render("login");
})

app.get("/register", function(req,res){
    res.render("register");
})

app.post("/register",function(req,res){
    const newuser = new User({
        email: req.body.username,
        password: req.body.password
    })
    newuser.save()
    .then(result=>{
        res.render("secrets");
    })
    .catch(err=>{
        console.log(err);
    })
})

app.post("/login",function(req,res){
    const username=req.body.username;
    const password=req.body.password;

    User.findOne({email: username})
    .then(result=>{
        if(result){
            if(result.password === password){
                res.render("secrets");
            }
            else{
                console.log("invalid password")
            }
        }
        else{
            console.log("user not found");
        }
    })
    .catch(err=>{
        console.log(err);
    })
})



app.listen(3000, function(){
    console.log("server started on port 3000")
});


//levels of auth
// Level 6 - Google OAuth 2.0 Auth
// Level 5 - Cookies and Sessions
// Level 4 - Hashing and Salting with bcrypt
// Level 3 - Hashing with md5
// Add Environment Vars
// Level 2 - Encryption
// Level 1 - Username and Password Only