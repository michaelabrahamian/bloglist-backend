const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, blog) => {
    return sum + blog.likes
  }

  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  const reducer = (topBlog, currentBlog) => {
    return (topBlog.likes > currentBlog.likes)
      ? topBlog
      : currentBlog
  }

  // Destructure the object to select only desired properties.
  return (({ title, author, likes }) => ({ title, author, likes }))(blogs.reduce(reducer, blogs[0]))
}

const mostBlogs = (blogs) => {
  // create an array containing the unique authors, and the number of blogs they have

  authorsGroup = _
    .chain(blogs)
    .groupBy('author')
    .map((value, key) => {
      return {
        author: key, blogs: value.length
      }
    })
    .value() 

  console.log(authorsGroup)

  // filter through this and get the author with highest number of blogs

  const reducer = (topAuthor, currentAuthor) => {
    return (topAuthor.blogs > currentAuthor.blogs)
      ? topAuthor
      : currentAuthor
  }

  console.log('top author', authorsGroup.reduce(reducer, authorsGroup[0]))
  return authorsGroup.reduce(reducer, authorsGroup[0])
}

const mostLikes = (blogs) => {
  // group by author
  authorsGroup = _
  .chain(blogs)
  .groupBy('author')
  .map((value, key) => {
    return {
      author: key, likes: value.reduce((sum, blog) => sum + blog.likes, 0)
    }
  })
  .value() 
  console.log(authorsGroup)

  // return top one

  const reducer = (topAuthor, currentAuthor) => {
    return (topAuthor.likes > currentAuthor.likes)
      ? topAuthor
      : currentAuthor
  }

  console.log(authorsGroup.reduce(reducer, authorsGroup[0]))
  return authorsGroup.reduce(reducer, authorsGroup[0])
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs, 
  mostLikes
}