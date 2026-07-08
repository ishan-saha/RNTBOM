import { useQuery, useMutation } from '@tanstack/react-query';
import * as scanApi from '../services/scanApi';

export function useScans() {
  return useQuery({
    queryKey: ['complianceScans'],
    queryFn: async () => {
      const res = await scanApi.getComplianceScans();
      return res.data.data?.scans || res.data.scans || [];
    },
  });
}

export function useScan(scanId) {
  return useQuery({
    queryKey: ['complianceScan', scanId],
    queryFn: async () => {
      const res = await scanApi.getComplianceScan(scanId);
      return res.data.data;
    },
    enabled: !!scanId,
  });
}

export function useRunScan() {
  return useMutation({
    mutationFn: (data) => scanApi.runComplianceScan(data).then(r => r.data),
  });
}

export function useDeleteScan() {
  return useMutation({
    mutationFn: (scanId) => scanApi.deleteComplianceScan(scanId),
  });
}
