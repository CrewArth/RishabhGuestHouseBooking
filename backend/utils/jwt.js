import jwt from 'jsonwebtoken';
import { normalizeRole } from './roles.js';

export const generateToken = (user) => {
    return jwt.sign({id: user._id, email: user.email, role: normalizeRole(user.role)},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN}
    )
};

export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};