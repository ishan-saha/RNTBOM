import { useQuery } from '@tanstack/react-query';
import * as reportApi from '../services/reportApi';

export function useReport(scanId) {
  return useQuery({
    queryKey: ['report', scanId],
    queryFn: async () => {
      const res = await reportApi.getReport(scanId);
      return res.data.data;
    },
    enabled: !!scanId,
  });
}
