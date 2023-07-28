//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session =require('express-session');
const passport=require("passport");
const passportlocalmongoose = require("passport-local-mongoose");
// const encrypt = require("mongoose-encryption");
//hashing
// const md5 = require("md5");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')



const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyparser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "out secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportlocalmongoose);
userSchema.plugin(findOrCreate);
//encryption
// userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields:['password']});

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
/*
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
*/

passport.serializeUser(function(user,done){
    done(null,user.id);
});

passport.deserializeUser(function(id,done){
    // User.findById(id,function(err,user){
    //     done(err,user);
    // })
    User.findById(id)
    .then(result=>{
        done(err,result);
    })
    
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL: "https://www.googleleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res){
    res.render("home");
})

app.get("/auth/google",
    passport.authenticate("google",{scope: ["profile"]}));

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
    res.redirect('/secrets');
    });

app.get("/login", function(req,res){
    res.render("login");
})

app.get("/register", function(req,res){
    res.render("register");
})

app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
        console.log("authenticated");
    }
    else{
        res.send("not authenticated");
    }
})

app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) {
          console.log('Error occurred during logout');
        }
        res.redirect('/login');
      });
    
});

app.post("/register",function(req,res){
    /*
    const newuser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })
    newuser.save()
    .then(result=>{
        res.render("secrets");
    })
    .catch(err=>{
        console.log(err);
    })
    */

    User.register({username: req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })
});


app.post("/login",function(req,res){
    /*
    const username=req.body.username;
    const password=md5(req.body.password);

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
    */
   const user=new User({
     username: req.body.username,
     password: req.body.password
   });
   req.login(user,function(err){
    if(err){
        console.log(err);
    }
    else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        });
    }
   })
});



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