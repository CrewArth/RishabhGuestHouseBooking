import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';
import { sendEmail } from '../utils/emailService.js';
import { welcomeEmail } from '../utils/emailTemplates/welcomeEmail.js';

//Controller for Registering Users
export const registerUser = async (req, res) => {
    try {
        //Get the Response Data
        const { firstName, lastName, email, phone, address, password } = req.body;

        //Check for Existing User
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({
            message: "User with this Email Already Exists."
        })

        //Create New User
        const newUser = new User({ firstName, lastName, email, phone, address, password });
        await newUser.save(); // pre-save will hash password

        await sendEmail({
            to: newUser.email,
            subject: "🎉 Welcome to Rishabh Guest House",
            html: welcomeEmail(newUser),
        })

        const token = generateToken(newUser);
        res.status(201).json({
            user: newUser,
            token
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

//Controller for Login User
export const loginUser = async (req, res) => {
    try {
        //Get Credentials
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User Not Found!" });
        if (!user.isActive) return res.status(403).json({ message: "User is not Active" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        const token = generateToken(user);
        res.status(200).json({ user, token });

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}