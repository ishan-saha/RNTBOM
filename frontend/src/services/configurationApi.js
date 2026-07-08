import API from './api';

export const parseConfiguration = (formData, onProgress) =>
  API.post('/configurations/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });

export const getParsedConfigurations = () =>
  API.get('/configurations');
