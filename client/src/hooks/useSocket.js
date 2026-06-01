import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';

let globalSocket = null;
export const getSocket = () => globalSocket;

const useSocket = () => {
  const { accessToken, isLoggedIn, user } = useAuthStore();
  const { addNotification, addUnreadChat } = useNotificationStore();

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;

    if (!globalSocket || !globalSocket.connected) {
      globalSocket?.disconnect();
      globalSocket = io('http://localhost:5000', {
        auth: { token: accessToken },
        transports: ['websocket'],
      });
      globalSocket.on('connect', () => console.log('소켓 연결됨'));
      globalSocket.on('disconnect', () => {
        console.log('소켓 끊김');
        globalSocket = null;
      });
    }

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

    globalSocket.on('notification:new', handleNotification);
    globalSocket.on('chat:message', handleChatMessage);

    return () => {
      globalSocket?.off('notification:new', handleNotification);
      globalSocket?.off('chat:message', handleChatMessage);
    };
  }, [isLoggedIn, accessToken]);
};

export default useSocket;
