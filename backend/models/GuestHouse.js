import mongoose from 'mongoose';

const guestHouseSchema = new mongoose.Schema({
  guestHouseName : {type: String, required: true, unique: true},
  location: {
    city: {type: String, required: true},
    state: {type: String, required: true}
  },
  image: {type: String},
  description: {type: String},
  maintenance: {type: Boolean, default: false}
}, {timestamps: true})


export default mongoose.model("GuestHouse", guestHouseSchema);