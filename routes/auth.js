const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/WrapAsync');
const User = require('../models/user');
const passport = require('passport');

router.get('/register', (req, res) => {
    res.render('auth/register')
});

router.post('/register', wrapAsync(async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        console.log(registeredUser);
        req.flash('success', "Welcome to Yelp Camp!")
        res.redirect('/campgrounds');
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}));

router.get('/login', (req, res)=>{
    res.render('auth/login');
});

router.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), wrapAsync(async (req, res)=>{
    req.flash('success', 'Welcome back!');
    res.redirect('/campgrounds');

}))

module.exports = router;