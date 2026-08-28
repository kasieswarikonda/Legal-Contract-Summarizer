import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({ baseURL: API_URL, withCredentials: true });

export async function uploadContract(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/contracts/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}
