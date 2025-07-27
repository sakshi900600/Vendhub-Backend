// controllers/adminController.js
const User = require('../models/User'); // Assuming your User model path
const Order = require('../models/Order'); // Assuming your Order model path
// const Product = require('../models/Product'); // Include if you need product-specific stats

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeFarmers = await User.countDocuments({ role: 'farmer', isActive: true, isApproved: true });
    const activeVendors = await User.countDocuments({ role: 'vendor', isActive: true, isApproved: true });

    // Calculate total revenue from delivered orders
    const deliveredOrders = await Order.find({ status: 'Delivered' });
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    // Calculate orders today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    // Calculate success rate (delivered orders / total orders)
    const totalOrders = await Order.countDocuments();
    const successRate = totalOrders > 0 ? (deliveredOrders.length / totalOrders * 100).toFixed(1) : 0;

    // Calculate platform commission (e.g., 5% of total revenue)
    const platformCommission = Math.round(totalRevenue * 0.05);

    // Calculate new registrations in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Daily active users (this is a complex metric, for simplicity, let's assume it's a count of users who logged in today)
    // You'd need a 'lastLogin' field on your User model and update it on login for accurate data.
    // For now, let's just use a placeholder or count active users.
    const dailyActiveUsers = await User.countDocuments({ isActive: true }); // Simplified for demo

    res.status(200).json({
      totalUsers,
      activeFarmers,
      activeVendors,
      totalRevenue,
      dailyActiveUsers,
      ordersToday,
      successRate,
      platformCommission,
      newRegistrations
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ msg: 'Server Error fetching dashboard stats.' });
  }
};

// @desc    Get all transactions (orders)
// @route   GET /api/admin/all-transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Order.find({})
      .populate('vendor', 'name email') // Populate vendor details
      .populate('farmer', 'name email') // Populate farmer details
      .populate('product', 'name unit price') // Populate product details
      .sort({ createdAt: -1 }); // Sort by most recent

    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ msg: 'Server Error fetching all transactions.' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/all-users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    // Exclude password and sensitive bank details
    const users = await User.find({}, '-password -bankDetails')
      .sort({ createdAt: -1 }); // Sort by most recent

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ msg: 'Server Error fetching all users.' });
  }
};


// controllers/adminController.js - ONLY THE updateUserStatus FUNCTION

// @desc    Update user status (approve, activate, deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
// controllers/adminController.js - ONLY THE updateUserStatus FUNCTION

exports.updateUserStatus = async (req, res) => {
  let action; // Declare action outside try-block to ensure it's defined for catch
  let id;     // <--- FIX: Declare id outside try-block as well

  try {
    id = req.params.id; // Assign id here
    action = req.body.action;

    // --- DIAGNOSTIC LINES (Optional, can remove once fixed) ---
    console.log('Backend: Received request for user ID:', id);
    console.log('Backend: req.body:', req.body);
    // --- END DIAGNOSTIC LINES ---

    // Validate the action type
    if (!['approve', 'activate', 'deactivate'].includes(action)) {
        return res.status(400).json({ msg: `Invalid action type specified: ${action}.` });
    }

    const userToUpdate = await User.findById(id);

    if (!userToUpdate) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Admins cannot change their own status or other admins' status via this route
    if (userToUpdate.role === 'admin' && req.user && userToUpdate._id.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Cannot change status of another admin.' });
    }
    if (userToUpdate.role === 'admin' && req.user && userToUpdate._id.toString() === req.user.id) {
        return res.status(403).json({ msg: 'Admins cannot change their own status via this interface.' });
    }

    let updatedUser;
    switch (action) {
      case 'approve':
        if (userToUpdate.role !== 'admin' && !userToUpdate.isApproved) {
          userToUpdate.isApproved = true;
          userToUpdate.isActive = true; // Automatically activate upon approval
        } else {
          return res.status(400).json({ msg: 'User is already approved or is an admin.' });
        }
        break;
      case 'activate':
        if (!userToUpdate.isActive) {
          userToUpdate.isActive = true;
        } else {
          return res.status(400).json({ msg: 'User is already active.' });
        }
        break;
      case 'deactivate':
        if (userToUpdate.isActive) {
          userToUpdate.isActive = false;
        } else {
          return res.status(400).json({ msg: 'User is already inactive.' });
        }
        break;
      default:
        return res.status(400).json({ msg: 'Invalid action specified (default case).' });
    }

    updatedUser = await userToUpdate.save();

    res.status(200).json({
      msg: `User ${action}d successfully.`,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        isApproved: updatedUser.isApproved,
        createdAt: updatedUser.createdAt
      }
    });

  } catch (error) {
    // This console.error line will now work correctly
    console.error(`Error updating user status (Action: ${action || 'UNKNOWN'}) for user ID: ${id || 'UNKNOWN'}. Full error:`, error);
    res.status(500).json({ msg: 'Server Error updating user status.' });
  }
};