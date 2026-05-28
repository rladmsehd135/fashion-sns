import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';

const useSocket = () => {
  const socket  = useRef(null);
  const { accessToken, isLoggedIn } = useAuthStore();
  const { addNotification, addUnreadChat } = useNotificationStore();

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;

    socket.current = io('http://localhost:5000', {
      auth: { token: accessToken },
    });

    socket.current.on('notification:new', (data) => {
      addNotification(data);
    });

    socket.current.on('chat:message', () => {
      addUnreadChat();
    });

    socket.current.on('chat:request_received', () => {
      addUnreadChat();
    });

    return () => socket.current?.disconnect();
  }, [isLoggedIn, accessToken]);

  return socket;
};

export default useSocket;