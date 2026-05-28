import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Layout from '../components/layout/Navbar';

import Login          from '../pages/Auth/Login';
import Register       from '../pages/Auth/Register';
import SocialCallback from '../pages/Auth/SocialCallback';
import Feed           from '../pages/Feed/Feed';
import Explore        from '../pages/Explore/Explore';
import CreatePost     from '../pages/Post/CreatePost';
import PostDetailPage from '../pages/Post/PostDetailPage';
import Profile        from '../pages/Profile/Profile';
import ChatPage       from '../pages/Chat/ChatPage';
import Search         from '../pages/Search/Search';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore();
  return !isLoggedIn ? children : <Navigate to="/" replace />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/auth/callback" element={<SocialCallback />} />

        {/* 인증 필요 라우트 */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index                    element={<Feed />} />
          <Route path="explore"           element={<Explore />} />
          <Route path="post/create"       element={<CreatePost />} />
          <Route path="post/:id"          element={<PostDetailPage />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="chat"              element={<ChatPage />} />
          <Route path="search"            element={<Search />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;