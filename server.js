const mongoose = require('mongoose');
const dontenv = require('dotenv');
process.on('uncaughtException', err=>{
    console.log('UNCAUGHT EXCEPTION! shuting down...');
    console.log(err.name,err.message);
        process.exit(1);
});

dontenv.config({path:'./config.env'});
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
mongoose.connect(
    process.env.DATABASE_LOCAL,{
    //this is atlas database connection
    // DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(()=>{
    // console.log(con.connections);
    console.log('DB connection successfully!')
});

const port = process.env.PORT || 5000;
const server = app.listen(port, ()=>{
    console.log(`App is running on port ${port}...`);
});

process.on('unhandledRejection', err=>{
    console.log('UNHANDLED REJECTION! shuting down...');
    console.log(err.name,err.message);
    server.close(()=>{
        process.exit(1);
    });
});

