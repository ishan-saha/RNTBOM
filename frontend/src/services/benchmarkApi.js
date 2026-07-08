import API from './api';

export const getBenchmarks = () => API.get('/benchmarks');

export const getBenchmark = (id) => API.get(`/benchmarks/${id}`);

export const deleteBenchmark = (id) => API.delete(`/benchmarks/${id}`);

export const importBenchmark = (formData, onProgress) =>
  API.post('/benchmarks/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
