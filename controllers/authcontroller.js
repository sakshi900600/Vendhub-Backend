const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    farmName,
    farmLocation,
    companyName,
    address,
    businessType,
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

    if (role === "farmer") {
      if (!farmName || !farmLocation) {
        return res.status(400).json({ msg: "For 'farmer' role, farm name and location are required." });
      }
    } else if (role === "vendor") {
      if (!companyName || !address || !businessType) {
        return res.status(400).json({ msg: "For 'vendor' role, company name, address, and business type are required." });
      }
    } else if (role === "admin") {
      if (!adminLevel) {
        return res.status(400).json({ msg: "For 'admin' role, admin level is required." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserFields = {
      name,
      email,
      password: hashedPassword,
      role,
    };

    if (role === "farmer") {
      newUserFields.farmName = farmName;
      newUserFields.farmLocation = farmLocation;
    } else if (role === "vendor") {
      newUserFields.companyName = companyName;
      newUserFields.companyAddress = address;
      newUserFields.businessType = businessType;
    } else if (role === "admin") {
      newUserFields.adminLevel = adminLevel;
      newUserFields.permissions = permissions || [];
    }

    user = await User.create(newUserFields);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    if (role === "farmer") {
      userResponse.farmName = user.farmName;
      userResponse.farmLocation = user.farmLocation;
    } else if (role === "vendor") {
      userResponse.companyName = user.companyName;
      userResponse.companyAddress = user.companyAddress;
      userResponse.businessType = user.businessType;
    } else if (role === "admin") {
      userResponse.adminLevel = user.adminLevel;
      userResponse.permissions = user.permissions;
    }

    res.status(201).json({ token, user: userResponse });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ msg: "Server error during registration." });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials (email not found)" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials (password mismatch)" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    if (user.role === "farmer") {
      userResponse.farmName = user.farmName;
      userResponse.farmLocation = user.farmLocation;
    } else if (user.role === "vendor") {
      userResponse.companyName = user.companyName;
      userResponse.companyAddress = user.companyAddress;
      userResponse.businessType = user.businessType;
    } else if (user.role === "admin") {
      userResponse.adminLevel = user.adminLevel;
      userResponse.permissions = user.permissions;
    }

    res.json({ token, user: userResponse });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error during login." });
  }
};
