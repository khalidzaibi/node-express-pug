const express = require('express');
const userController = require('./../controller/userController');
const authController = require('./../controller/authController');
const router = express.Router();
//SIGNUP routes
router.post('/signup',authController.signUp);
router.post('/login',authController.login);
router.get('/logout',authController.logout);
router.post('/forgotPassword',authController.forgotPassword);
router.patch('/resetPassword/:token',authController.resetPassword);

//Protect all routes after this Middleware
router.use(authController.protect);

router.patch('/updateMyPassword',authController.updatePassword);
router.get('/me', userController.getMe,userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe',userController.deleteMe);

//Only admin can perfom these tasks
router.use(authController.restrictTo('admin'));
//user router
router.route('/').get(userController.getAllUsers).post(userController.createUser);
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
