const fs = require("fs");

const User = require("../models/user");
const Contact = require("../models/contact");
const CV = require("../models/cv");
const HttpError = require("../models/http-error").HttpError;

const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AWS = require("aws-sdk");
const BUCKET_NAME_FILES = "jobs-softapps";
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.SECRET,
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
// --------------------------------- User Information

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    const { email, fname, lname, password } = req.body;

    if (!errors.isEmpty()) {
        errors.errors.map((err) => {
            if (err.param === "password") {
                return next(new HttpError("Password length must be greater than 6", 422));
            }
            if (err.param === "fname") {
                return next(new HttpError("First Name is required", 422));
            }
            if (err.param === "lname") {
                return next(new HttpError("Last Name is required", 422));
            }
            if (err.param === "email") {
                return next(new HttpError("Email is required", 422));
            }
        });
    }

    let existingUser;
    try {
        existingUser = await User.findOne({ email });
    } catch (error) {
        const err = new HttpError("Something went wrong, signing up failed...", 500);
        return next(err);
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError("Something went wrong, signing up failed...", 500));
    }

    let user;
    if (existingUser) {
        const err = new HttpError("User exists already!", 500);
        return next(err);
    } else {
        const newUser = new User({
            email: email.toLowerCase(),
            fname,
            lname,
            password: hashedPassword,
        });
        try {
            user = await newUser.save();
            transporter.sendMail({
                to: email,
                from: "sma3797@outlook.com",
                subject: "New Signup",
                html: `
            <h1>Hairtress Sign Up</h1>
            <p>Thank You For Signing Up</p>
            `,
            });
        } catch (error) {
            return next(new HttpError("Something went wrong, signing up failed...", 500));
        }
    }
    res.status(201).json({ message: "OK", user: user._id ? true : false });
};
exports.login = async (req, res, next) => {
    console.log("asd");
    res.status(200).json({ message: "Ok Logging Checking" });
    return;
    const { email, password } = req.body;
    let existingUser;

    try {
        existingUser = await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
        const err = new HttpError("Something went wrong, log in fails!", 500);
        return next(err);
    }

    if (!existingUser) {
        const err = new HttpError("No account associated with your provided email...", 401);
        return next(err);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (error) {
        const err = new HttpError("Something went wrong, log in fails!", 500);
        return next(err);
    }
    if (!isValidPassword) {
        const err = new HttpError("Invalid credentials", 401);
        return next(err);
    }

    let token;
    try {
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, process.env.JWT_USER_SECKEY);
    } catch (error) {
        const err = new HttpError("Something went wrong, log in fails!", 500);
        return next(err);
    }

    res.status(201).json({
        name: existingUser.name,
        email: existingUser.email,
        userId: existingUser._id,
        token: token,
    });
};

exports.resetPassword = async (req, res, next) => {
    const token = req.params.token;
    const password = req.body.password;
    const user = await User.findOne({
        resetToken: token,
        // resetTokenExpirationTime: { $gt: Date.now() },
    });
    if (!user) {
        return next(new HttpError("Something went wrong! Or your password reset link has been expired...", 500));
    }
    if (user.resetTokenExpirationTime && user.resetTokenExpirationTime < Date.now()) {
        return next(new HttpError("Your password reset link has been expired...", 500));
    }
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError("Something went wrong! Try again later...", 500));
    }

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpirationTime = undefined;
    try {
        await user.save();
        res.status(200).json({ message: "Password changed successfully!" });
    } catch (error) {
        return next(new HttpError("Something went wrong! Try again later...", 500));
    }
};

exports.contact = async (req, res, next) => {
    const { name, email, subject, message } = req.body;
    console.log("name, email, subject, message", name, email, subject, message);
    const contact = new Contact({
        name,
        email,
        subject,
        message,
    });
    try {
        await contact.save();
    } catch (error) {}
    res.status(200).json({ message: "Contact" });
};
exports.job = async (req, res, next) => {
    const { title, fname, lname, email, phone, employment, experience, letter } = req.body;
    const fileContent = req.file && fs.readFileSync(req.file.path);
    const params = req.file && {
        Bucket: BUCKET_NAME_FILES,
        Key: `${req.file.filename}`,
        Body: fileContent,
    };
    s3.upload(params, async (err, data) => {
        if (err) {
            return next(new HttpError("Something went wrong", 422));
        } else if (data) {
            if (req.file) {
                fs.unlink(req.file.path, (err) => {});
            }
            const job = new CV({
                title,
                fname,
                lname,
                email,
                phone,
                employment,
                experience,
                letter,
                cv: data.Location,
            });
            try {
                job.save();
            } catch (error) {
                return next(new HttpError("Something went wrong", 422));
            }
            res.status(200).json({ message: "Job" });
        }
    });
};

exports.getContacts = async (req, res, next) => {
    res.status(200).json({ message: "getContacts" });
};
exports.deleteContact = async (req, res, next) => {
    res.status(200).json({ message: "deleteContact" });
};

exports.getJobs = async (req, res, next) => {
    res.status(200).json({ message: "deleteJob" });
};
exports.deleteJob = async (req, res, next) => {
    res.status(200).json({ message: "deleteJob" });
};
