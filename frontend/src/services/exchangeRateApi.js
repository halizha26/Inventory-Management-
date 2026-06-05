import axios from 'axios';

const API_URL = 'http://localhost:3000/api/exchange-rate'; // Sesuaikan port backend-mu jika berbeda

export const getActiveRate = () => axios.get(API_URL);
export const syncExchangeRate = () => axios.post(`${API_URL}/sync`);
export const updateManualRate = (newRate) => axios.put(`${API_URL}/manual`, { newRate });