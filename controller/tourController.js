const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

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

exports.uploadImages = upload.fields([
    {name:'imageCover', maxCount:1},
    {name:'images', maxCount:3}
]);
exports.resizeTourImages = catchAsync(async(req,resp,next)=>{
    if(!req.files.imageCover || !req.files.images) return next();
    // 1) ImageCover Processing
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
    .resize(2000,1333)
    .toFormat('jpeg')
    .jpeg({quality:90})
    .toFile(`public/img/tours/${req.body.imageCover}`);
   
    // 2) images
    req.body.images = [];
   await Promise.all(req.files.images.map(async(file,i)=>{
    const fileName = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
        await sharp(file.buffer)
        .resize(2000,1333)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${fileName}`);
        req.body.images.push(fileName);
    }));

    next();
});

exports.aliasTopTours = (req,resp,next) =>{
    req.query.limit ='5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,ratingsAverage,price,summary,difficulty';
    next();
}

// exports.getAllTours = catchAsync(async (req,resp)=>{
//         //EXECUTE QUERY
//         const features = new APIFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();
//         const tours = await features.query;
        
//         resp.status(200).json({
//          status:'success',
//          result: tours.length,
//          data:{
//              tours
//          }
//         });
// });
exports.getAllTours = factory.getAll(Tour);
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour  =  factory.deleteOne(Tour);
exports.getTour = factory.getOne(Tour, {path: 'reviews'});

// exports.getTour = catchAsync(async(req,resp,next)=>{      
//     const tour= await Tour.findById(req.params.id).populate('reviews');
//     if(!tour) {
//         return next( new AppError('No tour found with that ID',404));
//     }
//     resp.status(200).json({
//         status:'success',
//         data:{
//             tour
//         }
//     });
// });

// exports.updateTour =catchAsync(async (req,resp,next)=>{
//         const tour = await Tour.findByIdAndUpdate(req.params.id,req.body,{
//             new:true,
//             runValidators:true
//         });
//         if(!tour){
//             return next(new AppError('No tour found with that ID', 404));
//         }
//         resp.status(200).json({
//             status:'success',
//             data:{
//                 tour:tour
//             }
//         });
   
// });


// exports.deleteTour =catchAsync(async (req,resp)=>{
//      const tour = await Tour.findByIdAndDelete(req.params.id);
//     if(!tour){
//         return next(new AppError('No tour found with that ID', 404));
//     }
//      resp.status(204).json({
//         status:'success',
//         data:null
//      });
  
// });

exports.getTourStates = async (req,resp)=>{
    try{
        const stats = await Tour.aggregate([
            { 
                $match : { ratingsAverage : { $gte:4.5 }}
            },
            {
                $group:{
                    _id:{ $toUpper: '$difficulty'},
                    // _id:'$ratingsAverage',
                    numTours: {$sum: 1},
                    numRatings:{ $sum: '$ratingsQuantity'},
                    avgRating: { $avg: '$ratingsAverage' },
                    avgPrice: { $avg: '$price'},
                    minPrice: { $min: '$price'},
                    maxPrice: { $max: '$price'}
                }
            },
            {
                $sort : { avgPrice: -1 }
            }
            // {
            //     $match: { _id: { $ne: 'EASY' } }
            // }
        ]);
        resp.status(200).json({
            status:'success',
            data:{
                stats
            }
        });
    }catch(err){
        resp.status(404).json({
            status:'fail',
            message:err
        });
    }
}

exports.getMonthlyPlan = async (req,resp)=>{
    try{
        const year = req.params.year * 1;
        const plan = await Tour.aggregate([
           {
            $unwind: '$startDates'
           },
           {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
           },
           {
            $group: {
                _id: { $month: '$startDates' },
                numTours: { $sum: 1},
                tours: { $push: '$name' }
            }
           },
           {
            $addFields: { month: '$_id'}
           },
           {
            $project:{ _id:0}
           },
           {
            $sort: { numTours: -1 }
           },
           {
            $limit:12
           }
        ]);
        resp.status(200).json({
            status:'success',
            data:{
                plan
            }
        });
    }catch(err){
        resp.status(404).json({
            status:'fail',
            message:err
        }); 
    }
}

//getTour Within

exports.getTourWithin =catchAsync( async(req,resp,next) => {
    const {distance, latlng, unit} = req.params;
    const [lat,lng] = latlng.split(',');

    const radius = unit==='mi' ? distance/3963.2 : distance/6378.1;
    if(!lat || !lng){
        next(new AppError('Please provide latitute and longitute in the formate lat, lng.',400));
    }

    const tours = await Tour.find({ startLocation : { $geoWithin: { $centerSphere :[[ lng,lat], radius]}}});

    resp.status(200).json({
        status:'success',
        result:tours.length,
        data:{
            data:tours
        }
    });
});