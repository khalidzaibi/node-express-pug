const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');


// exports.getAllReviews = catchAsync(async (req,resp,next)=>{
//     let filter = {};
//     if(req.params.tourId) filter = { tour : req.params.tourId};
//     const reviews = await Review.find(filter);

//     resp.status(200).json({
//         status:'success',
//         result:reviews.length,
//         data:{
//             reviews
//         }
//     })
// });

// exports.createReview = catchAsync(async(req,resp,next)=>{
//     //Allow nested route
//     if(!req.body.tour) req.body.tour = req.params.tourId;
//     if(!req.body.user) req.body.user = req.user.id;

//     const newReview = await Review.create(req.body);
//     resp.status(201).json({
//         status:'success',
//         data:{
//             review:newReview
//         }
//     })
// });
exports.setTourUserIds = (req,resp,next) => {
    //Allow nested route
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    next();
}

exports.getReview =  factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.createReview =  factory.createOne(Review);
exports.updateReview =  factory.updateOne(Review);
exports.deleteReview  =  factory.deleteOne(Review);
