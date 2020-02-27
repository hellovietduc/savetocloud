import io from 'socket.io-client';
import env from '../config/env';

const socket = io(env.SERVER_URL);

export default socket;
