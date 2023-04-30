const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { findOne, findById } = require('./../models/userModel');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,'public/img/users');
//     },
//     filename:(req,file,cb)=>{
//         const ext = file.mimetype.split('/')[1];
//         cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });
const multerStorage = multer.memoryStorage();
const multerFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null,true);
    }else{
        cb(new AppError('Not and image! Please upload only images.',400),false);
    }
}
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});
exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = catchAsync(async(req,res,next)=>{
    if(!req.file) return next();
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
   await sharp(req.file.buffer)
    .resize(500,500)
    .toFormat('jpeg')
    .jpeg({quality:90})
    .toFile(`public/img/users/${req.file.filename}`);
    next();
});
//allowed Fields
const filterObj = (obj, ...allowedFields) =>{
    const newObj = {};
    Object.keys(obj).forEach( el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    })
    return newObj;
}

//Users
// exports.getAllUsers = async(req,resp)=>{
//     const users = await User.find();

//     resp.status(200).json({
//         status:'success',
//         result:users.length,
//         data:{
//             users
//         }
//     })
// }

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User); 
exports.createUser = factory.createOne(User);
exports.updateUser =  factory.updateOne(User);
exports.deleteUser  =  factory.deleteOne(User); 

// exports.deleteUser = (req,resp)=>{
//     resp.status(500).json({
//         status:'error',
//         message:'this route not defined yet'
//     })
// }
exports.getMe = (req,resp,next) =>{
    req.params.id = req.user.id;
    next();
}

exports.updateMe = catchAsync(async(req,resp,next)=>{
    //1) create error if user POST password Data
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword.',400));
    }
    //2) filtered out unwanted  fields that are not allowed to update.
    const filterBody = filterObj(req.body,'name','email');
    if(req.file) filterBody.photo =req.file.filename;
    //3) Update user document 
    const updateUser = await User.findByIdAndUpdate(req.user.id,filterBody,{
        new:true,
        runValidators:true,
    });
    resp.status(200).json({
        status:'success',
        data:{
            user:updateUser
        }
    });

});

exports.deleteMe = catchAsync(async(req,resp,next)=>{
    //1) check Password and match with User Password
    if(!req.body.password){
        return next(new AppError('Please confirm your password first.',401));
    }
    //2) Confirm current user password
    const user = await User.findById(req.user.id).select('+password');
    if(!user || !(await user.correctPassword(req.body.password,user.password))){
        return next(new AppError('Incorrect password, provide correct password and try again',401));
    }
    //3) then delete current user
    await User.findByIdAndUpdate(req.user.id, {active: false});
    resp.status(204).json({
        status:'success',
        data:null
    })
});