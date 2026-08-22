// socket.io-client is loaded dynamically to avoid adding ~60KB to every page's bundle
import type { Socket } from 'socket.io-client';

let socket: Socket | null = null;
const socketInstances: Map<string, Socket> = new Map();

export async function getSocket(namespace: string): Promise<Socket> {
  const existingSocket = socketInstances.get(namespace);
  if (existingSocket) {
    return existingSocket;
  }

  // Dynamic import — only loads socket.io-client when actually needed
  const { io } = await import('socket.io-client');

  const socketUrl = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
    : 'https://api.iris365.in';

  const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;

  const newSocket = io(`${socketUrl}${namespace}`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socketInstances.set(namespace, newSocket);
  return newSocket;
}

export function disconnectSocket(namespace: string): void {
  const existingSocket = socketInstances.get(namespace);
  if (existingSocket) {
    existingSocket.disconnect();
    socketInstances.delete(namespace);
  }
}

export function disconnectAllSockets(): void {
  socketInstances.forEach((socket) => socket.disconnect());
  socketInstances.clear();
}

export { socket };