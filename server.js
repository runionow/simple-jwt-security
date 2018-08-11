var express = require("express");
var app =express();
var bodyParser = require("body-parser");
var morgan = require("morgan");
var mongoose = require("mongoose");
var jwt = require("jsonwebtoken");

var config = require("./config");
var user = require("./app/models/user");

var port = process.env.PORT || 8088;
mongoose.connect(config.database);
app.set('superSecret',config.secret);

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/',function(req,res){
    res.send("The API is at http://localhost:"+port+'/api');
});

app.get('/setup',function(req,res){
    var arun = new user({
        name: 'Arun',
        password: 'password',
        admin:true
    });

    arun.save(function(err){
        if(err) throw err;

        console.log('User succesfully saved');
        res.json({success: true});
    });
});

var apiRoutes = express.Router();

apiRoutes.post("/authenticate",function(req,res){
    user.findOne({
        name:req.body.name
    },function(err,_user){
        if(err) throw err;

        if(!_user){
            res.json({success: false,message: "Authentication failed"});
        }
        else if(_user){
            if(_user.password != req.body.pwd){
                res.json({success:false,message:"Authentication failed. Wrong Password"});
            }else{
                const payload  = {
                    admin : _user.admin
                };
                var token = jwt.sign(payload, config.secret,{
                    expiresIn: 1440                    
                });

                res.json({
                    success:true,
                    token:token,
                    message:"Token Generated"});
            }
        }
    });
});

apiRoutes.use(function(req,res,next){
    var token = req.body.token || req.query.token ||req.headers['x-access-token'];
    if(token){
        jwt.verify(token,config.secret,function(err,decoded){
                    if(err){
                        return res.json({success: false, message:'Failed to authenticate'});
                    } else{
                        req.decoded = decoded;
                        next();
                    }
                });
            }
    else{
        return res.json({success:false, message: "Unable to authenticate, no token provided"});
    }
});


apiRoutes.get("/",function(req,res){
    res.json({message: 'Welcome to the coolest api on earth'});
});

apiRoutes.get('/users',function(req,res){
    user.find({},function(err,users){
        res.json(users);
    });
})

app.use('/api',apiRoutes);

app.listen(port);
console.log("http://localhost:"+port);
