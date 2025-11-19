import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

export const socketUtil = {
  socket: null as Socket | null,
  subscribers: {} as Record<string, Array<(data: any) => void>>,

  connect: async (type : 'available'|'playing'|'watching'|'reviewing') => {
    console.log('type',type)
    try {
      // Prvo pokušaj da uzmeš token iz cookie (mobile app)
      let token = Cookies.get('token');
      
      // Ako nema token cookie, pokušaj sa sessionToken (web)
      if (!token) {
        token = Cookies.get('sessionToken');
      }

      if (token) {
        if (!socketUtil.socket) {
          socketUtil.socket = io('https://api.outpostchess.com', {
            transports: ['websocket', 'polling', 'webtransport'],
          });

          socketUtil.socket.on('connect', () => {
            console.log('Socket connected to outpost');
            socketUtil.socket?.emit('client_token', token);
            socketUtil.socket?.emit('users_online_status', type);
          });

          socketUtil.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            socketUtil.socket?.emit('users_online_status', 'available');
          });

          socketUtil.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
          });
        }
      } else {
        console.log('No token found. Socket not initialized.');
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
  },

  disconnect: () => {
    if (socketUtil.socket) {
      socketUtil.socket.disconnect();
      socketUtil.socket = null;
    }
  },

  emit: (event: string, data?: any) => {
    if (socketUtil.socket && socketUtil.socket.connected) {
      socketUtil.socket.emit(event, data);
    } else {
      console.warn('Socket is not connected. Cannot emit:', event);
    }
  },

  on: (event: string, callback: (data: any) => void) => {
    if (socketUtil.socket) {
      socketUtil.socket.on(event, callback);
      
      // Čuvamo subscriber za cleanup
      if (!socketUtil.subscribers[event]) {
        socketUtil.subscribers[event] = [];
      }
      socketUtil.subscribers[event].push(callback);
    }
  },

  off: (event: string, callback?: (data: any) => void) => {
    if (socketUtil.socket) {
      if (callback) {
        socketUtil.socket.off(event, callback);
        if (socketUtil.subscribers[event]) {
          socketUtil.subscribers[event] = socketUtil.subscribers[event].filter(
            (cb) => cb !== callback
          );
        }
      } else {
        socketUtil.socket.off(event);
        delete socketUtil.subscribers[event];
      }
    }
  },
};

export default socketUtil;