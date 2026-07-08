import API from './api';

export const getReport = (scanId) => API.get(`/reports/${scanId}`);
