import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({ baseURL: API_URL, withCredentials: true });

export async function triggerAnalysis(contractId) {
  return (await api.post(`/analysis/${contractId}/analyze`)).data;
}

export async function getAnalysis(contractId) {
  return (await api.get(`/analysis/${contractId}`)).data;
}

export async function askQuestion(contractId, question) {
  return (await api.post(`/analysis/${contractId}/ask`, { question })).data;
}

export async function getReport(contractId) {
  return (await api.get(`/analysis/${contractId}/report`)).data;
}
