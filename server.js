const express = require('express')
const app = express()
const nodemon = require('nodemon')
const session = require('express-session')
const rateLimit = require('express-rate-limit')

const loginlimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 requests per `window` (here, per 10 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Looks like were not getting anywhere, try again in 5 minutes. You might have more luck then :)'
})
const redirectLogin = (req, res, next) => {
    if (!req.session.userID) {
        res.redirect('/login')
    } else {
        next()
    }
}
const redirectHome = (req, res, next) => {
    if (req.session.userID) {
        res.redirect('/flights')
    } else {
        next()
    }
}

const {
    sess_lifetime = 1000*60*5,
    name = 'MyCookie',
    secret = 'Some Secret',

} = process.env


app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use(express.static('public'))
app.use('/css',express.static(__dirname + 'public/css'))
app.use(express.json())
app.use(session({
    name: name,
    secret: secret,
    resave: false,
    saveUninitailized: false,
    cookie: {
        maxAge: sess_lifetime,
        sameSite: true
    },
    saveUninitialized: true
}))


app.get('/updates', redirectLogin,(req, res) =>{
    res.render('pages/updates.ejs')
})

app.get('/flights', redirectLogin, (req, res) =>{
    res.render('pages/flights.ejs')
})

app.get('/about', redirectLogin, (req, res) =>{
    res.render('pages/about.ejs')
})

app.get('/airports', redirectLogin, (req, res) =>{
    res.render('pages/airports.ejs')
})

app.get('/planes', redirectLogin, (req, res) =>{
    res.render('pages/planes.ejs')
})

app.get('/register', redirectHome, (req, res) =>{
    res.render('pages/register.ejs')
})

app.get('/reset', redirectHome, (req, res) =>{
    res.render('pages/reset.ejs')
})

app.post('/reset', redirectHome, loginlimiter, (req, res) =>{ // FINISH THIS
    fetch('http://3.135.182.81/api/reset',{
        method: 'PUT',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(req.body)
    }).then(response => response.json())
    res.render('pages/login.ejs', {tryit: 'Try out your new password'})

})

app.post('/register', loginlimiter, (req, res) =>{
    fetch('http://3.135.182.81/api/users/register',{
        method: 'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(req.body)
    }).then()
    res.render('pages/login.ejs')
})

app.get('/login',  (req, res) =>{
    req.session.destroy()
    res.render('pages/login.ejs')
})

app.post('/login', loginlimiter, (req, res) =>{
    fetch('http://3.135.182.81/api/users/login',{
        method: 'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(req.body)
    }).then(function(res) {return res.json()}).then(function(data) {if (data[0].count === 1){
        req.session.userID = req.body.email;
        res.render('pages/flights')}
    else {
        res.render('pages/login', {wrongcreds: 'Username or Password Incorrect'})
    }})
})

app.listen('8080')