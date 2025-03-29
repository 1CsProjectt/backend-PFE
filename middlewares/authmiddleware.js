
import User  from "../models/UserModel.js";
import  JWT  from "jsonwebtoken";
import appError from "../utils/appError.js"
import {promisify} from "util"
import bcrypt from "bcryptjs";
import { catchAsync } from "../utils/catchAsync.js";

// const User = require("../models/UserModel.js");
// const JWT = require("jsonwebtoken");
// const appError = require("../utils/appError.js");
// const { promisify } = require("util");
// const bcrypt = require("bcryptjs");
// const { catchAsync } = require("../utils/catchAsync.js");



const protect = catchAsync(async (req, res, next) => {

    let token;
  
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }
  
    if (!token) {
        return next(new appError('You are not logged in! Please log in to access.', 401));
    }
  
    const decoded = await promisify(JWT.verify)(token, process.env.JWT_SECRET);
  
    const myuser = await User.findOne({ where: { id: decoded.id } });
  
    if (!myuser) {
        return next(new appError('The user belonging to this token no longer exists.', 401));
    }
  
    if (myuser.changedPasswordAfter(decoded.iat)) {
        return next(new appError('User recently changed password, please log in again.', 401));
    }
  
    req.user = myuser;
    next();
  });
  
  
  const restrictedfor=(...roles)=>{
  return (req,res,next)=>{
    if(!roles.includes(req.user.role)){
      return next(new appError(`Forbidden: Only ${roles} can access this route !!!`,403))
    };
    next();
  }
  };


  export {restrictedfor};
export {protect};


// module.exports = {
//     restrictedfor,
//     protect,
//   };