const AppError = require('./../utils/appError');
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message,400);
}
const handleValidationErrorDB = err =>{
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message,400);
}
const sendErrorDev = (err,req,resp)=>{
    //A) API
    if(req.originalUrl.startsWith('/api')){
        return resp.status(err.statusCode).json({
            status : err.status,
            error:err,
            message: err.message,
            stack:err.stack
        });
    }
    //B) render website
    console.error('Error ',err);
    return resp.status(err.statusCode).render('error',{
        title:'something went wrong',
        msg: err.message
    })
}

const sendErrorPro = (err,req,resp)=>{
    //A) API
    if(req.originalUrl.startsWith('/api')){
        //operational Trusted error :send to client
        if(err.isOperational){
            return resp.status(err.statusCode).json({
                status : err.status,
                message: err.message
            });
        }
        //B) programming or other unknow error don't leak error details
        //1) Log Error
        console.error('Error ',err);
        //2) send Generaic message
        return resp.status(500).json({
            status:'error',
            message:'something went very wrong'
        });
        
    }
    //A) API
    //operational Trusted error :send to client
    if(err.isOperational){
        return resp.status(err.statusCode).render('error',{
            title:'something went wrong',
            msg: err.message
        })
    }
    //B) render website
    //B) programming or other unknow error don't leak error details
    //1) Log Error
    console.error('Error ',err);
    //2) send Generaic message
    
    return resp.status(err.statusCode).render('error',{
        title:'something went wrong',
        msg: 'Please try again later.'
    });
}

const handleJWTError = err => new AppError('Invalid token. Please log in again!', 401);

module.exports = (err,req,resp,next)=>{
    err.statusCode = err.statusCode || 500;
    err.status     = err.status  || 'error';


    if(process.env.NODE_ENV ==='development'){
        sendErrorDev(err,req,resp);
    }else if(process.env.NODE_ENV === 'production'){
        let error = {...err};
        error.message = err.message;
        // error.name = err.name;
        // console.log(error);
        if(error.name === 'CastError') error = handleCastErrorDB(error);
        if(error.name ==='ValidatorError') error = handleValidationErrorDB(error);
        if(error.name ==='JsonWebTokenError') error = handleJWTError(error);
        sendErrorPro(error,req,resp);
    }
   
}