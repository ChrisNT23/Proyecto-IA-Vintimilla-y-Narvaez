import jwt from "jsonwebtoken";
import asyncHandler from './asyncHandler.js';
import User from '../models/userModel.js';

const protect=asyncHandler(async(req,res,next)=>{
   let token;

    //Lee el jwt de la cookie
    token=req.cookies.jwt;

    if(token){
        try{
            const decoded=jwt.verify(token,process.env.JWT_SECRET);
            req.user=await User.findById(decoded.userId).select('-password');
            console.log("Usuario autenticado:", req.user); 
            next();
        }catch(error){
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Token is invalid');
            } else {
                throw new Error('Not authorized, no token');
            }

        }
    }else{
        res.status(401);
        throw new Error('No authorized, no token');
    }
});

//Admin middleware

const admin=(req,res,next)=>{
    if(req.user&&req.user.isAdmin){
        next();
    }else{
        res.status(401);
        throw new Error('No authorized as admin');
    }
}

export {protect,admin};
