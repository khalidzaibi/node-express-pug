const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please tell us your name']
    },
    email:{
        type:String,
        required:[true,'Please provide your email'],
        validate:[validator.isEmail,'Please prvide valid email'],
        unique:true,
        lowercase:true
    },
    photo:{
        type:String,
        default:'default.jpg'
    },
    password:{
        type:String,
        required:[true,'Please provide password'],
        minlength:8,
        select:false
    },
    
    passwordConfirm:{
        type:String,
        required:[true,'Please confirm your password'],
        validate:{
            //This only works on SAVE()//
            validator: function(el){
                return el===this.password;
            },
            message:'Confirm password are not same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    role:{
        type:String,
        enum:['user','guide','lead-guide','admin'],
        default:'user'
    },
    active:{
        type:Boolean,
        default:true,
        select:false
    }
});

//ENCRYPT password
userSchema.pre('save', async function(next){
    //only run if passwrd modified
    if(!this.isModified('password')) return next();
    //HASH password
    this.password =await bcryptjs.hash(this.password,12);
    //add passwordChangedAt 
    this.passwordChangedAt = Date.now() -1000;
    //remove passwordConfirm
    this.passwordConfirm = undefined;
    next();
});
// userSchema.pre('save',async function(next){
//     if(!this.isModified('password') || this.isNew) return next();
//     this.passwordChangedAt = Date.now();
//     next();
// });

//only Get active users
userSchema.pre(/^find/, function(next){
    //this == keyword points to the current query
    this.find({active:{$ne:false}}) ;
    next();
});

//INSTANCE  method's
userSchema.methods.correctPassword =async function(canidatePassword,userPassword){
    return await bcryptjs.compare(canidatePassword,userPassword);
}
//changePasswordAfter Login
userSchema.methods.changePasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt, JWTTimestamp){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
        return JWTTimestamp < changedTimeStamp;
    }
   return false;
}
//Generate random String for resetPassword
userSchema.methods.generateResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpire = Date.now() + 60 *60 *1000;
    console.log({resetToken}, this.passwordResetToken);
    return resetToken;
}

const User = mongoose.model('User',userSchema);
module.exports = User;