import { io } from 'socket.io-client';

let socket = null;

export const connectSupervisorSocket = (token) => {
  if (socket) return socket;
  const wsBase = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  socket = new WebSocket(`${wsBase}/ws/supervisor?token=${token}`);

  socket.addEventListener('open', () => console.log('WebSocket connected'));
  socket.addEventListener('close', () => {
    console.log('WebSocket closed, reconnecting...');
    socket = null;
    setTimeout(() => connectSupervisorSocket(token), 2000);
  });
  socket.addEventListener('error', (err) => console.error('WebSocket error', err));
  return socket;
};

export const onSocketMessage = (socket, handler) => {
  if (!socket) return;
  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      handler(data);
    } catch (e) {
      console.error('Invalid WS message', e);
    }
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};
