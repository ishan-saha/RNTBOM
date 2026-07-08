import API from './api';

export const runComplianceScan = (data) => API.post('/scans/run', data);

export const getComplianceScans = () => API.get('/compliance');

export const getComplianceScan = (scanId) => API.get(`/compliance/${scanId}`);

export const deleteComplianceScan = (scanId) => API.delete(`/compliance/${scanId}`);
