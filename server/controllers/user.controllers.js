const Sendmail = require("../utlis/sendmail");
const ejs = require("ejs");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.models");
const CreateOtpAndToken = require("../utlis/otp");

const usercontroller = {
  signup: async (req, res) => {
    const { email, name, password } = req.body;

    if (req.body.role) {
      return res
        .status(400)
        .json({ message: "You do not have permission to set role" });
    }

    if (!email || !name || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const { otp, token } = CreateOtpAndToken({ ...req.body }, "5m");

    try {
      const htmltemplate = await ejs.renderFile(
        __dirname + "/../views/email.ejs",
        { name, otp }
      );

      await Sendmail(email, htmltemplate, "Verification Otp");

      res
        .cookie("verification_token", token, { httpOnly: true })
        .status(200)
        .json({ message: "OTP sent successfully" });
    } catch (error) {
      res.status(400).json({ message: error?.message });
    }
  },

  verify: async (req, res) => {
    const token = req.cookies.verification_token;
    if (!token) {
      return res.status(400).json({ message: "Please signup first" });
    }

    try {
      const decoded = jwt.verify(token, process.env.PRIVATE_KEY);
      const { otp, userData } = decoded;

      if (otp !== req.body.otp) {
        return res.status(400).json({ message: "OTP is not valid" });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser = await UserModel.create({
        ...userData,
        password: hashedPassword,
      });

      const htmltemplate = await ejs.renderFile(
        __dirname + "/../views/confirmation.ejs",
        { name: userData.name }
      );
      await Sendmail(userData.email, htmltemplate, "Confirmation");

      res.status(200).json({ message: "User created successfully", user: newUser });
    } catch (error) {
      res.status(400).json({ message: error?.message });
    }
  },

  signin: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const { password: _, ...userData } = user._doc;
    const { token } = CreateOtpAndToken({ ...userData }, "7d");

    res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json({ message: "User logged in successfully", user: userData });
  },

  getUserData: async (req, res) => {
    if (req.params.userId !== req.user._id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    try {
      const user = await UserModel.findById(req.params.userId).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "User found", user });
    } catch (error) {
      res.status(400).json({ message: error?.message });
    }
  },

  updateUserInfo: async (req, res) => {
    if (req.params.userId !== req.user._id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const updateData = req.file
      ? { ...req.body, profileImage: req.file.originalname }
      : { ...req.body };

    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.params.userId,
        { $set: updateData },
        { new: true }
      );
      res.status(200).json({ message: "Profile updated", user: updatedUser });
    } catch (error) {
      res.status(400).json({ message: error?.message });
    }
  },

  resetPasswordByEmail: async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please provide email" });
    }

    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { otp, token } = CreateOtpAndToken(user, "5m");

      const htmltemplate = await ejs.renderFile(
        __dirname + "/../views/resetpassword.ejs",
        { name: user.name, otp }
      );

      await Sendmail(email, htmltemplate, "Reset Password");

      res
        .cookie("Password_Reset_Token", token, { httpOnly: true })
        .status(200)
        .json({ message: "Reset password email sent" });
    } catch (error) {
      res.status(400).json({ message: error?.message });
    }
  },

  verifyPasswordByOtp: async (req, res) => {
    const token = req.cookies.Password_Reset_Token;
    if (!token) {
      return res.status(400).json({ message: "Password reset token is missing" });
    }

    try {
      const decoded = jwt.verify(token, process.env.PRIVATE_KEY);
      const { otp, userData } = decoded;

      if (otp !== req.body.otp) {
        return res.status(400).json({ message: "OTP is not valid" });
      }

      const newHashedPassword = await bcrypt.hash(req.body.password, 10);

      await UserModel.findByIdAndUpdate(userData._id, {
        $set: { password: newHashedPassword },
      });

      const htmltemplate = await ejs.renderFile(
        __dirname + "/../views/passwordresetsuccesfully.ejs",
        { name: userData.name }
      );

      await Sendmail(userData.email, htmltemplate, "Password Reset Successfully");

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(400).json({ message: error?.message });
    }
  },

  logout: async (req, res) => {
    res
      .clearCookie("access_token")
      .clearCookie("verification_token")
      .clearCookie("Password_Reset_Token")
      .status(200)
      .json({ message: "User logged out successfully" });
  },

  // Admin
  getAllUsers: async (req, res) => {
    try {
      const users = await UserModel.find().select("-password");
      res.status(200).json({ message: "All users", users });
    } catch (error) {
      res.status(400).json({ message: error?.message });
    }
  },

  deleteUserByAdmin: async (req, res) => {
    if (!req.params.userId) {
      return res.status(400).json({ message: "Please provide userId" });
    }

    try {
      const user = await UserModel.findByIdAndDelete(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "User deleted", user });
    } catch (error) {
      res.status(400).json({ message: error?.message });
    }
  },
};

module.exports = usercontroller;
