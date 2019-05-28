import axios from 'axios';
import env from '../config/env';

const instance = axios.create({
  baseURL: env.SERVER_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default instance;
