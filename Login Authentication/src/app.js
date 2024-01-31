const collection = require('./config');
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const { ObjectId } = require('mongodb');
const ejs = require('ejs');

const app = express();

// Middlewares
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('views'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Global variable for OTP
let otpBackend;

// Routes
app.get('/login', (req, res) => {
    res.render('login', { errorMessage: null, successMessage: null });
});

app.get('/signup', (req, res) => {
    res.render('signup', { errorMessage: null });
});

app.get('/otp/:email', async (req, res) => {
    const userEmail = req.params.email;
    const userData = await collection.findOne({ email: userEmail });
    res.render('otp', { userData });
});

app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.render('index');
});

app.post('/signup', async (req, res) => {
    try {
        otpBackend = randomstring.generate({
            length: 6,
            charset: 'numeric',
        });

        const data = {
            name: req.body.username,
            email: req.body.useremail,
            password: req.body.userpassword,
            confirmPassword: req.body.userconfirmpassword,
            checkbox: req.body.usercheckbox,
            otp: otpBackend,
            role: 'user',
        };

        const existingUser = await collection.findOne({ email: data.email });
        // if (existingUser) {
        //     return res.status(401).render('signup', { errorMessage: "Email Already Exists, Please Choose Another Email" });
        // }

        // if (data.password !== data.confirmPassword) {
        //     return res.status(401).render('signup', { errorMessage: "Oops! Password and Confirm Password Don't Match" });
        // }

        const saltRounds = 10;
        data.password = await bcrypt.hash(data.password, saltRounds);
        data.confirmPassword = await bcrypt.hash(data.confirmPassword, saltRounds);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'mrsaran786@gmail.com',
                pass: 'qftfoetkvopzmyit'
            }
        });

        const mailOptions = {
            from: 'mrsaran786@gmail.com',
            to: data.email,
            subject: 'Verification Code',
            text: `This is your verification code: ${otpBackend}`
        };

        // await transporter.sendMail(mailOptions);
        await collection.create(data);

        return res.status(200).render('otp');
    } catch (err) {
        console.error(err);
        return res.status(500).render('signup', { errorMessage: "Internal Server Error", successMessage: null });
    }
});

app.post('/otp', (req, res) => {
    try {
        const otpData = {
            otp: [
                req.body.otpInput1,
                req.body.otpInput2,
                req.body.otpInput3,
                req.body.otpInput4,
                req.body.otpInput5,
                req.body.otpInput6,
            ].join(''),
        };

        // No need to convert elements to integers, directly concatenate them
        const otp2Int = otpData.otp;

        // Compare the two strings
        if (otpBackend === otp2Int) {
            console.log("The OTPs are equal.");
            // Add further logic for successful OTP verification
            res.redirect('/'); // Redirect to a success page or desired location
        } else {
            console.log("The OTPs are not equal.");
            // Add further logic for failed OTP verification
            res.render('otp', { errorMessage: "Incorrect OTP. Please try again." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});




app.post('/login', async (req, res) => {
    try {
        const user = await collection.findOne({ email: req.body.email });

        if (!user || !user.password) {
            return res.status(404).render('login', { errorMessage: "Incorrect Email or Password", successMessage: null });
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(401).render('login', { errorMessage: "Incorrect Password", successMessage: null });
        }

        return res.redirect('/');
    } catch (error) {
        console.error("Error during login: ", error);
        return res.status(500).render('login', { errorMessage: "An error occurred during login.", successMessage: null });
    }
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server is running on localhost:${port}`);
});
