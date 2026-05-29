import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';

let globalSocket = null;

export const getSocket = () => globalSocket;

const useSocket = () => {
  const { accessToken, isLoggedIn } = useAuthStore();
  const { addNotification, setUnreadChat } = useNotificationStore();

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;
    if (globalSocket?.connected) return;

    globalSocket = io('http://localhost:5000', {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    globalSocket.on('connect', () => {
      console.log('소켓 연결됨');
    });

    globalSocket.on('notification:new', (data) => {
      addNotification(data);
      const style = { background:'#0F0F0F', color:'#F0F0F0', border:'1px solid #2A2A2A', fontSize:'13px' };
      if (data.type === 'follow') {
        toast(`${data.username}님이 팔로우했어요! 👋`, { icon: '🔔', style });
      }
      if (data.type === 'like') {
        toast(`${data.username}님이 좋아요를 눌렀어요 ❤️`, { style });
      }
      if (data.type === 'chat_request') {
        toast(`${data.username}님이 채팅을 요청했어요 💬`, { style });
      }
      if (data.type === 'chat_accepted') {
        toast(`${data.username}님이 채팅 요청을 수락했어요 🎉`, { style });
      }
    });

    globalSocket.on('chat:message', (msg) => {
      setUnreadChat(prev => (prev || 0) + 1);
    });

    globalSocket.on('disconnect', () => {
      console.log('소켓 끊김');
      globalSocket = null;
    });

    return () => {};
  }, [isLoggedIn, accessToken]);
};

export default useSocket;