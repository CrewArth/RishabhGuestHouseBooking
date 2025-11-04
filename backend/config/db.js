import mongoose from 'mongoose';

const connectDb = async () => {
    try{
        const conn = await mongoose.connect(`${process.env.DATABASE_URL}/${process.env.DATABASE_NAME}`);
        console.log("MongoDB Connected Sucessfully");
    }catch(error){
        console.error(`Error Connecting MongoDB: ${error}`);
        process.exit(1);
    }
}

export default connectDb;