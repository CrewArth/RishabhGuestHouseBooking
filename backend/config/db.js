import mongoose from 'mongoose';

const connectDb = async () => {
    try{
        const conn = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log("MongoDB Connected Sucessfully");
    }catch(error){
        console.error(`Error Connecting MongoDB: ${error}`);
        process.exit(1);
    }
}

export default connectDb;   