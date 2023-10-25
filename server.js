require('./config/db')
const userModel = require('./models/user')

const express = require('express')
const session = require('express-session')
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const jwtDecode = require('jwt-decode')
const axios= require('axios')

const app = express()
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({extended: true}))

let saltRounds = 10
let jwtSecret = process.env.JWT

app.use(session({
  secret: 'sadanand',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

const Auth = (req,res,next)=>{
  if(req.session.Auth){
    next()
  }
  else{
    return res.redirect('/login')
  }
}


app.get('/', (req, res) => {
 res.redirect('/login')
})

app.get('/login' ,(req,res)=>{
  res.render('login')
})

app.post('/login',async (req,res)=>{
    try{
      const {username ,password} = req.body
      const finduser = await userModel.findOne({username})
      if(finduser){
        const passwordMatch = await bcrypt.compare(password, finduser.password)
        if(passwordMatch){
          req.session.Auth = true
          const token = jwt.sign({ username}, jwtSecret, { expiresIn: '1h' })
          req.session.token = token

          res.redirect('/dashboard')
        }
        else{
          res.redirect('/login')
        }
      }
      else{
        res.redirect('/login')
      }


    }
  catch(err){
    console.log(err)
  }
})


app.get('/register' , (req,res)=>{
  res.render('register')
})

app.post('/register' , async (req,res)=>{
  
  try{
    const {username ,email,password} = req.body
   const newuser =  await userModel.findOne({email})
   if(newuser){
     return res.redirect('/register')
   }
   bcrypt.hash(password, saltRounds).then(async function (hash) {
    const newUser = new userModel({
      username: username,
      email: email,
      password: hash
    })
    await newUser.save()
    console.log('user saved')
    res.redirect('/login')
  })
   
  }
  catch(err){
    console.log(err)
  }
})


app.get('/dashboard', Auth, async (req, res) => {
  try {
    const token = req.session.token
    if (!token) {
      return res.redirect('/login')
    }
    const decoded = jwtDecode(token)
    res.render('dashboard', { apiDataRoute: '/api-data' ,username: decoded.username})
  } catch (err) {
    console.error(err)
    console.log(err)
  }
})


app.get('/api-data', Auth, async (req, res) => {
  try {
    const token = req.session.token
    if (!token) {
      return res.status(401).send('Unauthorized')
    }
  
    const apiResponse = await axios.get('https://real-gray-anemone-belt.cyclic.app/news', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    console.log(token)
    const decoded = jwtDecode(token)
    console.log(decoded)
    let fetch = apiResponse.data

    res.json(
      {
        token,
        decoded,
        fetch
      }
    )


  } catch (err) {
    console.error(err)
    res.status(500).send('Error fetching data from the API')
  }
})


app.post('/logout' ,(req,res)=>{
  req.session.destroy()
  res.redirect('/login')
})

app.listen(3000, ()=>{
  console.log('Server is listening')
})