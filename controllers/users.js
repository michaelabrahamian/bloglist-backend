const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.post('/', async (request, response, next) => {
  try {
    const body = request.body

    // validate that a username and password is given
    if (!(body.username && body.password)) {
      return response.status(400).json({ error: "username or password missing" })
    } else if (body.username.length < 3 || body.password.length < 3) {
      return response.status(400).json({ error: "username and password must be greater than 3 characters" })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
      username: body.username,
      name: body.name,
      passwordHash,
    })

    const savedUser = await user.save()
    console.log(savedUser)
    response.json(savedUser)
  } catch (error) {
    next(error)
  }
})

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({})
    .populate('blogs')
    
  response.json(users)
})

module.exports = usersRouter