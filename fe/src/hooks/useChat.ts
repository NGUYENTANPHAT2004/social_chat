// src/hooks/useChat.ts
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

interface Message {
  id: string;
  roomId: string;
  userId: string;
  sender: string;
  content: string;
  createdAt: string;
}

export const useChat = (roomId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const socket = useSocket();

  // Lấy tin nhắn từ server khi component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Giả sử API endpoint là /messages/{roomId}
        const response = await fetch(`/api/messages/${roomId}`);
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId]);

  // Kết nối socket và lắng nghe tin nhắn mới
  useEffect(() => {
    if (!socket) return;

    // Tham gia phòng
    socket.emit('joinRoom', roomId);

    // Lắng nghe tin nhắn mới
    socket.on('newMessage', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      // Rời phòng khi unmount
      socket.emit('leaveRoom', roomId);
      socket.off('newMessage');
    };
  }, [socket, roomId]);

  // Gửi tin nhắn
  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !content.trim()) return;

      socket.emit('sendMessage', { roomId, message: content });
    },
    [socket, roomId]
  );

  return { messages, loading, sendMessage };
};