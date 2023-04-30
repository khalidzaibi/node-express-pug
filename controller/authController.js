const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');


const signInToken = id => {
 return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN
 });
}
//create and send Token
const createSendToken = (user,statusCode,resp)=>{
    const token = signInToken(user._id);
    //Remove password from output
    user.password = undefined;
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE_IN * 24 *60 * 60 * 1000),        
        httpOnly:true
    };
    if(process.env.NODE_ENV ==='production') cookieOptions.secure=true;
    resp.cookie('jwt',token,cookieOptions)
    resp.status(statusCode).json({
        status:'success',
        token,
        data:{
            user
        }
    });
}
exports.signUp = catchAsync(async(req,resp,next)=>{
    // const newUser = await User.create(req.body);
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role:req.body.role,
        // passwordChangedAt:req.body.passwordChangedAt
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    new Email(newUser,url).sendWelcome();
    //GENERATE Token
    createSendToken(newUser,201,resp);
   
});

exports.login =async (req,resp,next)=>{
    const {email,password} = req.body;
    
    //1) check if EMAIL and PASSWORD exist
     if(!email || !password){
       return next(new AppError('Please provide email and password',400));
     }

    //2) check if user exists & password is correct
     const user =await User.findOne({email}).select('+password');
    
     if(!user || !(await user.correctPassword(password,user.password))){
        return next(new AppError('Incorrect email or password',401));
     }

    //3) if everything is okay, send token to client
    createSendToken(user,200,resp);
};

exports.logout = (req,resp) =>{
    resp.cookie('jwt','loggedout',{
        expires: new Date(Date.now()+2*1000),
        httpOnly:true
    });
    resp.status(200).json({status:'success'})
};
exports.protect =catchAsync(async (req,resp,next) =>{
    //1) Getting token and check if it's there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }else if(req.cookies.jwt){
        token = req.cookies.jwt;
    }
    if(!token) return next(new AppError('You are not logged in! Please log in to access.',401));
    //2) Verification Token
    const decoded=   await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    
    //3) check if user still Exist
    const currentUser = await User.findById(decoded.id);
    if(!currentUser) return next(new AppError('The user belongs to this toke does no longer exist.',401));

    //4) check if user changed password after the token was issued
    if(currentUser.changePasswordAfter(decoded.iat)) return next(new AppError('User recently changed password! Please log in again.',401));

    //Grand ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    resp.locals.user = currentUser;
    next();
});

//check IS LOGGED IN OR/NOT
exports.isLoggedIn =async (req,resp,next) =>{
    if(req.cookies.jwt){
        try{
            //1) Verification Token
            const decoded=   await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET);
            
            //2) check if user still Exist
            const currentUser = await User.findById(decoded.id);
            if(!currentUser) return next();
        
            //3) check if user changed password after the token was issued
            if(currentUser.changePasswordAfter(decoded.iat)) return next();
        
            //THERE IS A LOGGED IN USER
            resp.locals.user = currentUser;
            return next();
        }catch{
            return next();
        }
    }
    next();
};
exports.restrictTo = (...roles)=>{
    return (req,resp,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action.',403));
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async (req,resp,next)=>{
    //1) Get user Based on POSTED email
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError('There is no user with this email.',404));
    }

    //2) Generate the random reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save({validateBeforeSave: false});

    //3) Send it to user's Email
    try{
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user,resetUrl).sendPasswordReset();
        resp.status(200).json({
            status:'success',
            message:'Token sent to email!'
        });
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        await user.save({validateBeforeSave: false});

       return next(new AppError(`There was an error sending the email. Try again later!`),500);
    }

});
exports.resetPassword = async(req,resp,next)=>{
    //1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpire:{ $gt: Date.now()}});
    //2) if token not expired yet and there is user, set the new password
    if(!user){
        return next(new AppError('Token is invalid or has expired',400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    //3) Update changedPasswordAt property for the user

    //4) Log the user in, send JWT
    createSendToken(user,200,resp);
}

exports.updatePassword = catchAsync(async(req,resp,next) => {
    
    //1) Get user from collection
    const user =await User.findById(req.user.id).select('+password');

    //2) check Posted Password current is correct
    if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
        return next(new AppError('Your current password is wrong.',401));
    }
    //3) if so, Update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save(); 

    //4) Log user in, send JWT
    createSendToken(user,200,resp);
});