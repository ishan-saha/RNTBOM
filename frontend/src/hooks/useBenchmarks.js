import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as benchmarkApi from '../services/benchmarkApi';

export function useBenchmarks() {
  return useQuery({
    queryKey: ['benchmarks'],
    queryFn: async () => {
      const res = await benchmarkApi.getBenchmarks();
      return res.data.data?.benchmarks || res.data.benchmarks || [];
    },
  });
}

export function useBenchmark(id) {
  return useQuery({
    queryKey: ['benchmark', id],
    queryFn: async () => {
      const res = await benchmarkApi.getBenchmark(id);
      return res.data.data?.benchmark || res.data.benchmark;
    },
    enabled: !!id,
  });
}

export function useDeleteBenchmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => benchmarkApi.deleteBenchmark(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['benchmarks'] }),
  });
}

export function useImportBenchmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, onProgress }) =>
      benchmarkApi.importBenchmark(formData, onProgress).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['benchmarks'] }),
  });
}
