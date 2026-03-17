import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext.jsx';

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (socket === null) throw new Error("useSocket must be used within SocketProvider");
  return socket;
};

