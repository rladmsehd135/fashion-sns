const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const passport     = require('./config/passport');
require('dotenv').config();

const authRoutes         = require('./routes/authRoutes');
const userRoutes         = require('./routes/userRoutes');
const postRoutes         = require('./routes/postRoutes');
const commentRoutes      = require('./routes/commentRoutes');
const followRoutes       = require('./routes/followRoutes');
const chatRoutes         = require('./routes/chatRoutes');
const bookmarkRoutes     = require('./routes/bookmarkRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler       = require('./middlewares/errorHandler');
const storyRoutes   = require('./routes/storyRoutes');
const rankingRoutes = require('./routes/rankingRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/posts',         postRoutes);
app.use('/api',               commentRoutes);
app.use('/api/follow',        followRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/bookmarks',     bookmarkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/ai',      require('./routes/aiRoutes'));


app.use(errorHandler);

module.exports = app;