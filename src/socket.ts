import { io } from 'socket.io-client';
const socketUrl = import.meta.env.VITE_SOCKET_SERVER_URL;
console.log({socketUrl});

export const socket = io(socketUrl);