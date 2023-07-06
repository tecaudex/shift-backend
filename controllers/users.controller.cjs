const User = require("../models/user.model.cjs");
const fs = require("fs");
const AWS = require("aws-sdk");
const Session = require("../models/session.model.cjs");
const moment = require("moment");
const Gratitude = require("../models/gratitude.model.cjs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Function for user signup
exports.signup = async (req, res) => {
    // Extract the required data from the request body
    const {email, password, accountCreationMethod} = req.body;
    const file = req.file;

    try {
        // Find the user by their email
        let user;
        user = await User.findOne({where: {email: email}});
        if (user) return res.status(409).json({error: "User account already exists"});

        // Upload profile picture to AWS S3
        let profilePicture;
        if (file) {
            AWS.config.update({
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
            });

            const s3 = new AWS.S3({region: process.env.AWS_BUCKET_REGION});

            const key = `user_profile_image/${Date.now()}-${file.originalname}`;

            const fileStream = fs.createReadStream(file.path);

            const uploadParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Body: fileStream,
                Key: key,
            };

            const s3UploadResponse = await s3.upload(uploadParams).promise();
            profilePicture = s3UploadResponse.Location;

            fs.unlink(file.path, (err) => {
                if (err) {
                    console.error(err);
                }
                console.log("Deleted file successfully.");
            });
        }

        // Generate a salt for password hashing
        const salt = await bcrypt.genSalt(10);

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user with the hashed password
        user = await User.create({
            email,
            password: hashedPassword,
            profilePicture,
            accountCreationMethod,
        });

        // Generate a JWT token
        const token = jwt.sign({userId: user.id}, process.env.JWT_ACCESS_SECRET);

        // Send the response with the token
        res.json({token});
    } catch (error) {
        // Handle any errors that occur during signup
        console.error(error);
        res.status(500).json({error: "Failed to sign up"});
    }
};

// Function for user login
exports.login = async (req, res) => {
    // Extract the required data from the request body
    const {email, password} = req.body;

    console.log("email", email, password);

    try {
        // Find the user by their email
        const user = await User.findOne({where: {email}});

        // Check if the user exists
        if (!user) {
            res.status(401).json({error: "Invalid email or password"});
            return;
        }

        // Compare the provided password with the hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        // Check if the password matches
        if (!isPasswordMatch) {
            res.status(401).json({error: "Invalid email or password"});
            return;
        }

        // Generate a JWT token
        const token = jwt.sign({userId: user.id}, process.env.JWT_ACCESS_SECRET);

        // Send the response with the token
        res.json({token});
    } catch (error) {
        // Handle any errors that occur during login
        console.error(error);
        res.status(500).json({error: "Failed to log in"});
    }
};

exports.checkUserExists = async (req, res) => {
    const {email} = req.body;

    try {
        const user = await User.findOne({
            where: {
                email: email,
            },
        });

        return res.json({exists: !!user});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Server error"});
    }
};

exports.getAll = async (req, res) => {
    try {
        // Check if user is an admin
        if (!req.user.role == "admin") {
            return res.status(401).json({
                error: "Unauthorized. Only admin users can access this route.",
            });
        }
        const users = await User.find({});
        return res.json({users});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"});
    }
};

// Get user
exports.getUser = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        // Exclude the password field from the user object
        const userWithoutPassword = {...user.toJSON()};
        delete userWithoutPassword.password;

        res.json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Failed to get user"});
    }
};

exports.updateUser = async (req, res) => {
    const {name, email} = req.body;
    const file = req.file;

    try {
        let user = req.user;

        if (!user) {
            return res.status(400).json({error: "User not found"});
        }

        if (file) {
            AWS.config.update({
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
            });

            const s3 = new AWS.S3(process.env.AWS_BUCKET_REGION);

            const key = `user_profile_image/${user._id}/${Date.now()}-${
                file.originalname
            }`;

            const fileStream = fs.createReadStream(file.path);

            const uploadParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Body: fileStream,
                Key: key,
            };

            const s3UploadResponse = await s3.upload(uploadParams).promise();
            const profilePicture = s3UploadResponse.Location;

            user.profilePicture = profilePicture;

            fs.unlink(file.path, (err) => {
                if (err) {
                    throw err;
                }

                console.log("Delete File successfully.");
            });
        }

        if (name) user.name = name;
        if (email) user.email = email;

        await user.save();

        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
        };

        res.json(userData);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({error: "Server error"});
    }
};

exports.getResults = async (req, res) => {
    const userId = req.user._id; // assume the authenticated user's ID is stored in req.user._id

    const gratitudesCount = await Gratitude.countDocuments({user: userId});

    const userSessions = await Session.find({user: userId}).sort({
        createdAt: "asc",
    });

    let totalTime = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let previousDate;

    userSessions.forEach((session) => {
        totalTime += session.timeTaken;
        const sessionDate = moment(session.createdAt).startOf("day");

        // Check if the current session's date is consecutive with the previous session's date
        if (previousDate && sessionDate.diff(previousDate, "days") === 1) {
            currentStreak++;
        } else {
            // Check if the current streak is longer than the longest streak
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
            currentStreak = 1;
        }

        previousDate = sessionDate;
    });

    // Check if the current streak is longer than the longest streak
    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
    }

    return res.json({
        gratitudesCount,
        totalTime,
        longestStreak,
    });
};

exports.getGratitudeStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const startDate = moment().startOf("week").add(1, "days");
        const endDate = moment().endOf("day");

        const totalGratitudes = await Gratitude.countDocuments({
            user: userId,
            createdAt: {$gt: startDate.toDate(), $lt: endDate.toDate()},
        });

        const avgGratitudesPerDay = parseInt(totalGratitudes / 7);

        // Calculate daily change in average
        const today = moment();
        const daysElapsed = today.diff(startDate, "days") + 1;
        const yesterdayTotalGratitudes =
            totalGratitudes -
            (await Gratitude.countDocuments({
                user: userId,
                createdAt: {
                    $gt: today.startOf("day").toDate(),
                    $lt: today.endOf("day").toDate(),
                },
            }));

        const yesterdayAvgGratitudes =
            daysElapsed != 1
                ? parseInt(yesterdayTotalGratitudes / (daysElapsed - 1))
                : 0;

        const dailyChangeInAvg = parseInt(
            avgGratitudesPerDay - yesterdayAvgGratitudes
        );

        return res.status(200).json({
            avgGratitudesPerDay: avgGratitudesPerDay,
            dailyChangeInAvg: dailyChangeInAvg,
        });
    } catch (err) {
        console.log(err);
        throw res.status(500).json({error: err});
    }
};

exports.deleteUser = async (req, res) => {
    try {
        // todo implement cases for google and apple account deletion

        const userId = req.user._id;

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        if (user.profilePicture) {
            const s3 = new AWS.S3({
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
                region: process.env.AWS_BUCKET_REGION,
            });

            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: user.profilePicture.split("/").pop(),
            };

            await s3.deleteObject(params).promise();
        }

        await Session.deleteMany({user: userId});
        await Gratitude.deleteMany({user: userId});
        await Statistics.deleteOne({userId});

        return res
            .status(200)
            .json({message: "User account deleted successfully"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"});
    }
};

exports.saveGratitudePoints = async (userId, points) => {
    // console.log("saveGratitudePoints \n", "userId:", userId ,"\n points:" , points);
    try {
        await User.updateOne({_id: userId}, {$inc: {points: points}});
    } catch (error) {
        console.log("error", error);
    }
};
