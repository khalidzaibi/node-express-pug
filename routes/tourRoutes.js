const express = require('express');
const tourController = require('./../controller/tourController');
const authController = require('./../controller/authController');
// const reviewController = require('./../controller/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');
const router = express.Router();


// router.route('/:tourId/reviews')
// .post(authController.protect,authController.restrictTo('user'),reviewController.createReview);

router.use('/:tourId/reviews',reviewRouter);

router.route('/top-five-cheap-tours').get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStates);
router.route('/monthly-plan/:year').get(
    authController.protect,
    authController.restrictTo('admin','lead-guid','guide'), 
    tourController.getMonthlyPlan);


router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getTourWithin);
//tours-within?:distance=200&center=40,-45&unit=mi
//tours-within/200/center/40,-45/unit/mi

router.route('/')
.get(
    authController.protect,
    tourController.getAllTours)
.post(
    authController.protect,
    authController.restrictTo('admin','lead-guid'), 
    tourController.createTour);

router.route('/:id')
.get(tourController.getTour)
.patch(
    authController.protect,
    authController.restrictTo('admin','lead-guid'), 
    tourController.uploadImages,
    tourController.resizeTourImages,
    tourController.updateTour)
.delete(
    authController.protect,
    authController.restrictTo('admin','lead-guid'), 
    tourController.deleteTour);


module.exports = router;