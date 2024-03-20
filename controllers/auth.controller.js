const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../Schema/AuthModel");

// SignUp
exports.register = async (req, res) => {
  try {
    const hashPassword = bcrypt.hashSync(req.body.password, 10);
    const hashConfirmPassword = bcrypt.hashSync(req.body.confirmpassword, 10);

    // Check if the email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res
        .status(400)
        .send({ success: false, error: "Email already exist!" });
    }

    if (req.body.password !== req.body.confirmpassword) {
      return res.status(400).send({
        success: false,
        error: "Password and confirm password does not match!",
      });
    } else {
      const newUser = new User({
        firstName: req.body.firstname,
        lastName: req.body.lastname,
        email: req.body.email,
        password: hashPassword,
        cpassword: hashConfirmPassword,
      });

      await newUser.save();
      res.status(201).json({ success: true, message: "Signup successful" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, error: "Internal server error" });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(404)
        .send({ success: false, error: "Email not found!" });
    }

    const comparedPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!comparedPassword) {
      return res
        .status(400)
        .send({ success: false, error: "Incorrect password!" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      process.env.ACCESS_SECRET_KEY
    );

    res.status(200).send({
      success: true,
      message: "Login successful",
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      token: token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, error: "Internal server error" });
  }
};
