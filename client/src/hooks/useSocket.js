import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';

let globalSocket = null;
export const getSocket = () => globalSocket;

const useSocket = () => {
  const { accessToken, isLoggedIn, user } = useAuthStore();
  const { addNotification, addUnreadChat } = useNotificationStore();
  const socketRef = useRef(null); // Use a ref to hold the socket instance

  useEffect(() => {
    // If not logged in or no token, disconnect any existing socket and return
    if (!isLoggedIn || !accessToken) {
      if (socketRef.current) {
        console.log('User logged out, disconnecting socket.');
        socketRef.current.disconnect();
        socketRef.current = null;
        globalSocket = null; // Also clear global reference
      }
      return;
    }

    // If a socket already exists and is connected, reuse it
    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    // Connect new socket
    const newSocket = io('http://localhost:5000', {
        auth: { token: accessToken },
        transports: ['websocket'],
      });

    newSocket.on('connect', () => console.log('소켓 연결됨'));
    newSocket.on('disconnect', (reason) => {
      console.log('소켓 끊김');
      if (socketRef.current === newSocket) { // Only nullify if it's the same instance
        socketRef.current = null;
        globalSocket = null;
      }
    });
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current = newSocket;
    globalSocket = newSocket; // Keep global reference updated

    const handleNotification = (data) => {
      addNotification(data);
      const toastStyle = { background: '#0F0F0F', color: '#F0F0F0', border: '1px solid #2A2A2A', fontSize: '13px' };
      if (data.type === 'follow') {
        toast(`${data.username}님이 팔로우했어요! 👋`, { icon: '🔔', style: toastStyle });
      } else if (data.type === 'like') {
        toast(`${data.username}님이 좋아요를 눌렀어요 ❤️`, { style: toastStyle });
      } else if (data.type === 'comment') {
        toast(`${data.username}님이 댓글을 남겼어요 💬`, { style: toastStyle });
      }
    };

    const handleChatMessage = (msg) => {
      if (Number(msg.sender_id) !== Number(user?.id)) {
        addUnreadChat();
      }
    };

    newSocket.on('notification:new', handleNotification);
    newSocket.on('chat:message', handleChatMessage);

    return () => {
      console.log('Socket useEffect cleanup running, removing listeners.');
      // Remove listeners from the specific socket instance created in this effect run
      globalSocket?.off('notification:new', handleNotification);
      globalSocket?.off('chat:message', handleChatMessage);
    };
  }, [isLoggedIn, accessToken]);
};

export default useSocket;
