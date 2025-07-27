const User = require("../models/User");
const bcrypt = require("bcryptjs"); // Already imported, good
const jwt = require("jsonwebtoken"); // Already imported, good

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    phoneNumber, // Added
    profileImage, // Added
    farmName,
    farmLocation,
    farmAddress, // Added (object)
    farmSize, // Added
    cropsGrown, // Added
    farmingType, // Added
    bankDetails, // Added (object)
    companyName, // Matches frontend businessName
    businessAddress, // Matches frontend businessAddress
    businessType,
    gstNumber, // Added
    fssaiLicense, // Added
    businessHours, // Added (object)
    adminLevel,
    permissions
  } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User with this email already exists" });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "Please enter all required fields: name, email, password, and role." });
    }

    if (!["farmer", "vendor", "admin"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role specified. Must be 'farmer', 'vendor', or 'admin'." });
    }

    // Determine initial approval status based on role
    // Admins are auto-approved, Farmers/Vendors need manual approval
    const isApproved = (role === 'admin');

    const newUserFields = {
      name,
      email,
      password, // Password will be hashed by pre-save hook in User model
      role,
      phoneNumber,
      profileImage,
      isApproved, // Set initial approval status
      isActive: true, // New users are active by default
    };

    // Add role-specific fields
    if (role === "farmer") {
        if (!farmName || !farmLocation) {
            return res.status(400).json({ msg: "For 'farmer' role, farm name and location are required." });
        }
        newUserFields.farmName = farmName;
        newUserFields.farmLocation = farmLocation;
        newUserFields.farmAddress = farmAddress;
        newUserFields.farmSize = farmSize;
        newUserFields.cropsGrown = cropsGrown;
        newUserFields.farmingType = farmingType;
        newUserFields.bankDetails = bankDetails;
    } else if (role === "vendor") {
        // IMPORTANT: Frontend sends businessName, businessAddress, businessType.
        // Ensure keys match what's sent from AuthPage vendor signup section.
        if (!companyName || !businessAddress || !businessType) {
            return res.status(400).json({ msg: "For 'vendor' role, company name, business address, and business type are required." });
        }
        newUserFields.companyName = companyName;
        newUserFields.businessAddress = businessAddress;
        newUserFields.businessType = businessType;
        newUserFields.gstNumber = gstNumber;
        newUserFields.fssaiLicense = fssaiLicense;
        newUserFields.businessHours = businessHours;
    } else if (role === "admin") {
        if (!adminLevel) {
            return res.status(400).json({ msg: "For 'admin' role, admin level is required." });
        }
        newUserFields.adminLevel = adminLevel;
        newUserFields.permissions = permissions || [];
    }

    user = await User.create(newUserFields);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Construct user response object to send back to frontend
    const userResponse = {
      _id: user._id, // Changed to _id for consistency with frontend
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive, // Include active status
      isApproved: user.isApproved, // Include approval status
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage,
    };

    // Add role-specific fields to userResponse if they exist on the saved user object
    if (user.role === "farmer") {
        userResponse.farmName = user.farmName;
        userResponse.farmLocation = user.farmLocation;
        userResponse.farmAddress = user.farmAddress;
        userResponse.farmSize = user.farmSize;
        userResponse.cropsGrown = user.cropsGrown;
        userResponse.farmingType = user.farmingType;
        // Do NOT send bankDetails back to frontend for security reasons
    } else if (user.role === "vendor") {
        userResponse.companyName = user.companyName;
        userResponse.businessAddress = user.businessAddress;
        userResponse.businessType = user.businessType;
        userResponse.gstNumber = user.gstNumber;
        userResponse.fssaiLicense = user.fssaiLicense;
        userResponse.businessHours = user.businessHours;
    } else if (user.role === "admin") {
        userResponse.adminLevel = user.adminLevel;
        userResponse.permissions = user.permissions;
    }

    res.status(201).json({ msg: 'Registration successful!', token, user: userResponse });
  } catch (err) {
    console.error("Registration error:", err);
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        let messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ msg: messages.join(', ') });
    }
    res.status(500).json({ msg: "Server error during registration." });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials (email not found)" });
    }

    // Use the matchPassword method from the User model
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials (password mismatch)" });
    }

    // Check user's active status
    if (!user.isActive) {
      return res.status(401).json({ msg: "Your account is currently inactive. Please contact support." });
    }

    // Check approval status for non-admin roles
    if (user.role !== 'admin' && !user.isApproved) {
      return res.status(401).json({ msg: "Your account is pending admin approval. Please wait for activation." });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Construct user response object to send back to frontend
    const userResponse = {
      _id: user._id, // Changed to _id for consistency with frontend
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive, // Include active status
      isApproved: user.isApproved, // Include approval status
      phoneNumber: user.phoneNumber, // Added
      profileImage: user.profileImage, // Added
    };

    // Add role-specific fields to userResponse if they exist on the user object
    if (user.role === "farmer") {
        userResponse.farmName = user.farmName;
        userResponse.farmLocation = user.farmLocation;
        userResponse.farmAddress = user.farmAddress; // Added
        userResponse.farmSize = user.farmSize; // Added
        userResponse.cropsGrown = user.cropsGrown; // Added
        userResponse.farmingType = user.farmingType; // Added
    } else if (user.role === "vendor") {
        userResponse.companyName = user.companyName;
        userResponse.businessAddress = user.businessAddress; // Added
        userResponse.businessType = user.businessType;
        userResponse.gstNumber = user.gstNumber; // Added
        userResponse.fssaiLicense = user.fssaiLicense; // Added
        userResponse.businessHours = user.businessHours; // Added
    } else if (user.role === "admin") {
        userResponse.adminLevel = user.adminLevel;
        userResponse.permissions = user.permissions;
    }

    res.json({ msg: 'Login successful!', token, user: userResponse });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error during login." });
  }
};