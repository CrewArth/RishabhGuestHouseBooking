import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateToken } from '../utils/jwt.js';
import { sendEmail } from '../utils/emailService.js';
import { welcomeEmail } from '../utils/emailTemplates/welcomeEmail.js';
import { passwordResetEmail } from '../utils/emailTemplates/passwordReset.js';
import { logAction } from '../utils/auditLogger.js';

//Controller for Registering Users
export const registerUser = async (req, res) => {
    try {
        //Get the Response Data
        const { firstName, lastName, email, phone, address, password } = req.body;

        // const allowedEmailSuffix = '@rishabhsoft.in';
        // if (!email || !email.toLowerCase().endsWith(allowedEmailSuffix)) {
        //     return res.status(400).json({
        //         message: "Only rishabhsoft.in email addresses are allowed to register."
        //     });  
        // }

        //Check for Existing User
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({
            message: "User with this Email Already Exists."
        })

        //Create New User
        const newUser = new User({ firstName, lastName, email, phone, address, password });
        await newUser.save(); // pre-save will hash password

        // Generate token immediately (don't wait for email/audit log)
        const token = generateToken(newUser);
        
        // Send response immediately
        res.status(201).json({
            user: newUser,
            token
        });

        // Fire-and-forget: Send email asynchronously (don't block response)
        sendEmail({
            to: newUser.email,
            subject: "🎉 Welcome to Rishabh Guest House",
            html: welcomeEmail(newUser),
        }).catch(err => console.error("Email send error:", err));

        // Fire-and-forget: Log action asynchronously (don't block response)
        logAction({
          action: "USER_REGISTERED",
          entityType: "User",
          entityId: newUser._id,
          performedBy: newUser.email,
          details: {
            name: `${newUser.firstName} ${newUser.lastName}`.trim(),
            email: newUser.email,
            phone: newUser.phone,
          },
        }).catch(err => console.error("Audit log error:", err));
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

// Controller for Forgot Password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // respond success regardless for security
            return res.status(200).json({ message: "If an account exists, password reset instructions were sent" });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + (15 * 60 * 1000); // 15 minutes
        await user.save({ validateBeforeSave: false });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        try {
            await sendEmail({
                to: email,
                subject: "Password Reset Instructions",
                html: passwordResetEmail(user, resetLink)
            });
        } catch (emailErr) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            console.error("Error sending reset email:", emailErr);
            return res.status(500).json({ message: "Unable to send reset email right now" });
        }

        return res.status(200).json({ message: "If an account exists, password reset instructions were sent" });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error while processing request" });
    }
}

// Controller for Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { token, email, password } = req.body;

        if (!token || !email || !password) {
            return res.status(400).json({ message: "Token, email and password are required" });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            email,
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error while resetting password" });
    }
}