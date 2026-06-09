
import { DashboardService } from '../services/dashboardService';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const perspective = query.perspective as string;
  
  if (perspective) {
    return await DashboardService.getMetricsByPerspective(perspective);
  }
  
  return await DashboardService.getCMISummary();
});
