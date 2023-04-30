const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.getOverview =catchAsync( async(req,resp)=>{
    const tours = await Tour.find();
    resp.status(200).render('overview',{
        title:'All Tours',
        tours
    });
});

exports.getTour =catchAsync(async (req,resp,next)=>{
    //1) get the data from requested URL (including reviews and guides)
    const tour = await Tour.findOne({slug:req.params.slug}).populate({
        path:'reviews',
        fields:'review rating user'
    });
    if(!tour){
        return next(new AppError('There is no tour with that name.',404));
    }
    //2) Build template

    //3) render template using data form

    resp.status(200).render('tour',{
        title:`${tour.name} Tour`,
        tour
    });
});

exports.getLoginForm = (req,resp)=>{
    resp.status(200).render('login',{
        title:'Login'
    });
}

exports.getAccount = (req,resp) =>{
    resp.status(200).render('account',{
        title:'Your account'
    });
}

exports.getMyTours = catchAsync(async(req,resp,next)=>{
    //1) find all bookings
    const bookings = await Booking.find({user:req.user.id});

    //2) find tours with the return ID's
    const tourIDs = bookings.map(el=>el.tour); 
    const tours = await Tour.find({_id:{ $in: tourIDs}});

    resp.status(200).render('overview',{
        title:'My Tours',
        tours
    })
});