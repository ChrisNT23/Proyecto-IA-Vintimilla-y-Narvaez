import jwt from "jsonwebtoken";
import asyncHandler from './asyncHandler.js';
import User from '../models/userModel.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Intentar leer el token de las cookies
    token = req.cookies.jwt;

    // 2. Si no hay cookie, intentar leer del header Authorization (Bearer token)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId).select("-password");
            // console.log("Usuario autenticado:", req.user?.name);
            next();
        } catch (error) {
            console.error("❌ Error de autenticación:", error.message);
            res.status(401);
            if (error.name === "TokenExpiredError") {
                throw new Error("Token expired");
            } else if (error.name === "JsonWebTokenError") {
                throw new Error("Token is invalid");
            } else {
                throw new Error("Not authorized, token failed");
            }
        }
    } else {
        res.status(401);
        throw new Error("Not authorized, no token");
    }
});

//Admin middleware

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401);
        throw new Error('No authorized as admin');
    }
}

export { protect, admin };
