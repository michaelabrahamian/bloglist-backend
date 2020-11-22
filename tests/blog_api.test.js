const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')
const bcrypt = require('bcrypt')

const User = require('../models/user')
const Blog = require('../models/blog')

beforeEach(async () => {
  // set up blogs
  await Blog.deleteMany({})

  const blogObjects = helper.initialBlogs
    .map(blog => new Blog(blog))

  let promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)

  // set up users
  await User.deleteMany({})

  const userObjects = helper.initialUsers
    .map(user => new User(user))
  
  promiseArray = userObjects.map(user => user.save())
  await Promise.all(promiseArray)
})

test('blogs are returned as JSON', async() => {
  console.log('entered test')

  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('blogs have an id', async () => {
  const response = await api.get('/api/blogs')

  //console.log(response.body[0])
  expect(response.body[0].id).toBeDefined()
})

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'this is a new blog',
    author: 'michael',
    url: 'test_url.com',
    likes: 2
  }

  const userLogin = {
    ...helper.initialUsers[0],
    password: 'ashashashashash'
  }
  
  // get a token
  const tokenResp = await api
    .post('/api/login')
    .send(userLogin)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  
  expect(tokenResp.body.token).toBeDefined()


  const response = await api
    .post('/api/blogs')
    .set({ Authorization: `Bearer ${tokenResp.body.token}` })
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const contents = blogsAtEnd.map(b => b.title)
  expect(contents).toContain(
    'this is a new blog'
  )
})

test('an invalid blog is rejected', async () => {
  const newBlog = {
    author: 'michael',
    likes: 2
  }

  const userLogin = {
    ...helper.initialUsers[0],
    password: 'ashashashashash'
  }
  
  // get a token
  const tokenResp = await api
    .post('/api/login')
    .send(userLogin)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  
  expect(tokenResp.body.token).toBeDefined()

  const response = await api
    .post('/api/blogs')
    .set({ Authorization: `Bearer ${tokenResp.body.token}` })
    .send(newBlog)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  console.log(response.status)
})

test('adding a blog fails without a token', async () => {
  const newBlog = {
    title: 'this is a new blog',
    author: 'michael',
    url: 'test_url.com',
    likes: 2
  }

  const response = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(401)
    .expect('Content-Type', /application\/json/)

  console.log(response.status)
})

test('a valid blog deletion succeeds with status code 204', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  const userLogin = {
    ...helper.initialUsers[0],
    password: 'ashashashashash'
  }
  
  // get a token
  const tokenResp = await api
    .post('/api/login')
    .send(userLogin)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  
  expect(tokenResp.body.token).toBeDefined()

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set({ Authorization: `Bearer ${tokenResp.body.token}` })
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(
    helper.initialBlogs.length - 1
  )

  const titles = blogsAtEnd.map(r => r.title)

  expect(titles).not.toContain(blogToDelete.title)
})

test('a blog can be updated', async () => {
  const blogsAtStart = await helper.blogsInDb()
  
  updatedLikes = blogsAtStart[0].likes + 1
  // increment likes by 1
  const blogToUpdate = {
    ...blogsAtStart[0], 
    likes: updatedLikes
  }

  const response = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(blogToUpdate)
    .expect(200)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd[0].likes).toBe(updatedLikes)
  
})


describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    expect(result.body.error).toContain('`username` to be unique')
    
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails if no password given', async () => {
    const usersAtStart = await helper.usersInDb()
    
    const newUser = {
      username: 'newUser1',
      name: 'new user'
    }

    const result = await api 
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password missing')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails if username is less than 3 chars', async () => {
    const usersAtStart = await helper.usersInDb()
    
    const newUser = {
      username: 'me',
      password: 'paaasss',
      name: 'new user'
    }

    const result = await api 
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('username and password must be greater than 3 characters')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})



afterAll(() => {
  mongoose.connection.close()
})