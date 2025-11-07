import User from '../models/User.js';
import GuestHouse from '../models/GuestHouse.js';

export const getAdminSummary = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalGuestHouses = await GuestHouse.countDocuments();

        res.json({
            totalUsers,
            totalGuestHouses,
            totalBookings: 0, // placeholders for now
            approvedBookings: 0,
            pendingBookings: 0,
            rejectedBookings: 0,
        })
    } catch (error) {
        console.error('Error in admin summary', error);
        res.status(500).json({error: 'Server error while fetching dashboard stats'});
    }
}

// GET /api/admin/users
export const listUsers = async (req, res) => {
  try {
    // Only select needed fields
    const users = await User.find({}, 'firstName lastName email isActive').lean();
    return res.json({ users });
  } catch (err) {
    console.error('listUsers error:', err);
    return res.status(500).json({ error: 'Server error while fetching users' });
  }
};