const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user')

  response.json(blogs)
})

blogsRouter.post('/', async (request, response, next) => {
  
  try {
    const body = request.body
    //const token = getTokenFrom(request)
    const decodedToken = jwt.verify(request.token, process.env.SECRET) //jwt.verify(token, process.env.SECRET)

    if (!decodedToken.id) {
      return response.status(401).json({ 
        error: 'token missing or invalid' 
      })
    }

    // set user to the first user found
    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes,
      user: user._id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    user.save()

    response.status(201).json(savedBlog)
  } catch(error) {
    next(error)
  }
})

blogsRouter.delete('/:id', async (request, response, next) => {
  try {
    // only allow user who added the blog to delete it
    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    if (!decodedToken.id) {
      return response.status(401).json({ 
        error: 'token missing or invalid' 
      })
    }
    
    // get the blog 
    const blogToDelete = await Blog.findById(request.params.id)
    console.log('blogToDelete', blogToDelete)
    
    // check if matching blog
    if (!blogToDelete) {
      return response.status(404).json({
        error: 'no matching blog'
      })
    }

    // check if the blog's user matches the current user ID in token
    if (blogToDelete.user.toString() != decodedToken.id.toString()) {
      return response.status(401).json({
        error: 'token does not match blog\'s creator'
      })
    }

    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()

  } catch (error) {
    next(error)
  }
})

blogsRouter.put('/:id', async (request, response, next) => {
  const body = request.body

  const blog = {
    likes: body.likes
  }

  try {
    updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true})
    response.status(200).json(updatedBlog)
  } catch(error) {
    next(error)
  }
  
    
})

module.exports = blogsRouter