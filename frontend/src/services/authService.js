import axios from 'axios';
import {API_URL} from '../utils/constants';

const api = axios.create({baseURL: API_URL, withCredentials: true});

export async function login(credentials){ return (await api.post('/auth/login', credentials)).data; }
export async function register(credentials){ return (await api.post('/auth/register', credentials)).data; }
export async function logout(){ return (await api.post('/auth/logout')).data; }
export async function getCurrentUser(){ return (await api.get('/auth/me')).data; }
