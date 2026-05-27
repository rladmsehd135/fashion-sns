const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes    = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');
const postRoutes    = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const followRoutes  = require('./routes/followRoutes');
const chatRoutes    = require('./routes/chatRoutes');
const errorHandler  = require('./middlewares/errorHandler');

const app = express();

app.use(cors({
  origin:      process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/posts',    postRoutes);
app.use('/api',          commentRoutes);  // /api/posts/:id/comments + /api/comments/:id
app.use('/api/follow',   followRoutes);
app.use('/api/chat',     chatRoutes);

app.use(errorHandler);

module.exports = app;