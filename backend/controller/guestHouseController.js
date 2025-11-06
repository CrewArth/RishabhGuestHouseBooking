import GuestHouse from '../models/GuestHouse.js';

export const createGuestHouse = async(req, res) => {
    try{
        const {guestHouseName, location, image, description} = req.body;  
        
        if(!guestHouseName || !location.city || !location?.state){
            return res.status(400).json({message: "Required Fields Missing"});
        }

        const existing = await GuestHouse.findOne({guestHouseName});

        if(existing){
            return res.status(400).json({message: "Guest House Name Already Exists"})
        }

        const guestHouse = await GuestHouse.create({
            guestHouseName,
            location,
            image,
            description
        })

        return res.status(201).json({
            message: "Guest House Created Sucessfully", guestHouse
        })
    }catch(error){
        console.error("Error creating GuestHouse ", error);
        res.status(500).json({message: "Error creating guest house"});
    }
}

// Get all the Guest Houses
export const getGuestHouses = async (req,res) => {
        try{
            const guestHouses = await GuestHouse.find();
            res.status(200).json(guestHouses);
        }catch(error){
            console.error("Error fetching guest houses")
            res.status(500).json({message: "Server error"})
        }
    }