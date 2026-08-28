import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({ baseURL: API_URL, withCredentials: true });

export async function uploadContract(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/contracts/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress,
    });
    return response.data;
}

export async function getContracts() {
    const response = await api.get('/contracts');
    return response.data;
}

export async function getContractById(id) {
    const response = await api.get(`/contracts/${id}`);
    return response.data;
}
