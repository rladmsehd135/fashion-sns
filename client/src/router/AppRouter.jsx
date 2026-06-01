import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { CircularProgress, Box } from '@mui/material';
import Layout            from '../components/layout/Navbar';
import Login             from '../pages/Auth/Login';
import Register          from '../pages/Auth/Register';
import SocialCallback    from '../pages/Auth/SocialCallback';
import Feed              from '../pages/Feed/Feed';
import Explore           from '../pages/Explore/Explore';
import CreatePost        from '../pages/Post/CreatePost';
import EditPost          from '../pages/Post/EditPost';
import PostDetailPage    from '../pages/Post/PostDetailPage';
import Profile           from '../pages/Profile/Profile';
import EditProfile       from '../pages/Profile/EditProfile';
import ChatPage          from '../pages/Chat/ChatPage';
import Search            from '../pages/Search/Search';
import PeopleSuggestions from '../components/common/PeopleSuggestions';
import Settings          from '../pages/Settings/Settings';
import axiosInstance     from '../api/axiosInstance';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore();
  return !isLoggedIn ? children : <Navigate to="/" replace />;
};

const AppRouter = () => {
  const { isLoggedIn, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !isLoggedIn) {
      axiosInstance.get('/users/me')
        .then(res => {
          setAuth(res.data, localStorage.getItem('accessToken'));
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          logout();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{
        minHeight:'100vh', display:'flex',
        alignItems:'center', justifyContent:'center',
        backgroundColor:'#080808',
      }}>
        <CircularProgress sx={{ color:'#E8C96D' }} />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"         element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"      element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/auth/callback" element={<SocialCallback />} />

        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index                    element={<Feed />} />
          <Route path="explore"           element={<Explore />} />
          <Route path="explore/people"    element={<PeopleSuggestions />} />
          <Route path="post/create"       element={<CreatePost />} />
          <Route path="post/edit/:id"     element={<EditPost />} />
          <Route path="post/:id"          element={<PostDetailPage />} />
          <Route path="profile/edit"      element={<EditProfile />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="chat"              element={<ChatPage />} />
          <Route path="search"            element={<Search />} />
          <Route path="settings"          element={<Settings />} />  
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;