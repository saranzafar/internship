const collection = require('./config')
const express = require('express')
const bcrypt = require('bcrypt');
const session = require('express-session');
const ejs = require('ejs');

const app = express()
app.use(express.json())
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.static('views'))
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

app.get('/login', async (req, res) => {
    res.render('login', { errorMessage: null, successMessage: null });
});

app.get('/signup', async (req, res) => {
    res.render('signup', { errorMessage: null })
})
app.get('/', async (req, res) => {
    // Set Cache-Control header to prevent caching
    res.setHeader('Cache-Control', 'no-store');
    res.render('index');
});

app.post('/signup', async (req, res) => {
    const data = {
        name: req.body.username,
        email: req.body.useremail,
        password: req.body.userpassword,
        confirmPassword: req.body.userconfirmpassword,
        checkbox: req.body.usercheckbox,
        role: 'user',
    };
    try {
        const existingUser = await collection.findOne({ email: data.email });
        if (existingUser) {
            return res.status(401).render('signup', { errorMessage: "Email Already Exists, Please Choose Another Email" });
        }
        if (data.password != data.confirmPassword) {
            return res.status(401).render('signup', { errorMessage: "OOps! Password and Confirm Password Does't Match" });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        const hashedConfirmPassword = await bcrypt.hash(data.confirmPassword, saltRounds);
        data.password = hashedPassword;
        data.confirmPassword = hashedConfirmPassword;
        try {
            await collection.create(data);
        } catch (err) {
            res.status(500).render('signup', { errorMessage: "Internal Server ErrorError While Saving Signup data", successMessage: null });
        }
        return res.status(200).render('login', { errorMessage: null, successMessage: "Account Created Successfully! Please Login." });
    } catch (err) {
        res.status(500).render('signup', { errorMessage: "Internal Server Error", successMessage: null });
    }
});
app.post('/login', async (req, res) => {
    try {
        const user = await collection.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).render('login', { errorMessage: "Incorrect Email", successMessage: null });
        }
        if (!user.password) {
            return res.status(404).render("login", { errorMessage: "Incorrectt Password", successMessage: null })
        }
        const validpassword = await bcrypt.compare(req.body.password, user.password);
        if (!validpassword) {
            return res.status(401).render("login", { errorMessage: "Incorrectt Password", successMessage: null })
        }
        // If user and password are valid, redirect to the desired page
        return res.redirect('/');
    } catch (error) {
        // console.error("Error during login: ", error);
        res.render('login', { errorMessage: "An error occurred during login.", successMessage: null, successMessage: null });
    }
});

const port = 8000;
app.listen(port, () => {
    console.log(`Server is running: localhost:${port} `);
})