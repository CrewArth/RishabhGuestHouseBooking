import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/*
Add auto increment unique id, similar to object id. 
left to add auto*/

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },

    lastName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    phone: {
        type: Number,
        required: true,
        trim: true,
        unique: true,
    },

    address: {
        type: String,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },

    isActive: {
        type: Boolean,
        default: true
    }
},
{ timestamps: true })


userSchema.pre('save', async function(next){
    //Only hash password if it is changed or new
    if(!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


export default mongoose.model("User", userSchema);