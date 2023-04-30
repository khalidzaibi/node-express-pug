const Tour =require('./../models/tourModel');

const fs = require('fs');

const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

exports.getAllTours = (req,resp)=>{
    resp.status(200).json({status:'success',results:tours.length,data:{tours}});
}
exports.createTour = (req,resp)=>{
    const newId = tours.length;
    const newTour = Object.assign({id:newId},req.body);
    tours.push(newTour);
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`,JSON.stringify(tours), err=>{
        resp.status(201).json({
            status:"success",
            data:{
                tour:newTour
            }
        })
    });
}
exports.getTour = (req,resp)=>{
    const id = req.params.id*1;
    const result = tours.find(el=>el.id===id);
    resp.status(200).json(result);
}
exports.updateTour = (req,resp)=>{
    const id = req.params.id*1;
    resp.status(200).json({
        status:'success',
        data:{
            tour:'Tour Update'
        }
    });
}
exports.deleteTour = (req,resp)=>{
    const id = req.params.id*1;
    resp.status(200).json({
        status:'success',
        data:{
            tour:'tour deleted'
        }
    })
}