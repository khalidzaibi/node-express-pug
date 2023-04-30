const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const app = express();

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');


// Global Middleware 
//Set Security HTTP Headers
// app.use(helmet());

//Development logging
if(process.env.NODE_ENV==='development'){
    app.use(morgan('dev'));
}
//Limit request from same API
const limiter = rateLimit({
    max:100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an Hour!'
});
app.use('/api',limiter);

//Body parser, reading Data from body into req.body
app.use(express.json());
app.use(cookieParser());

//set Template Engin
app.set('view engine', 'pug');
app.set('views',path.join(__dirname,'views'));

//Serving static Files
app.use(express.static( path.join(__dirname,'public')));


//Data sanitization NoSQL Qury Injection
app.use(mongoSanitize());

//Data Sanitization  against XSS
app.use(xss());

//Prevent Parameter Pollution
app.use(hpp({
    whitelist :['duration','ratingsAverage','ratingsQuantity','maxGroupSize','difficulty','price']
}));


// Test Middleware
// app.use((req,resp,next)=>{
//    req.requestTime = new Date().toISOString();
//    console.log(req.cookies);
//     next();
// });
// console.log(process.env.NODE_ENV)
app.use('/',viewRouter);



app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);
app.use('/api/v1/bookings',bookingRouter);


//ERROR HANDLING /route error handling
app.all('*',(req,resp,next)=>{
    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;
    next(new AppError(`Can't find ${req.originalUrl} on this server!`,404));
});

//GLOBAL error handler middleware
app.use(globalErrorHandler);

module.exports = app;

