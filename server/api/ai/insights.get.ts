
import { AIService } from '../../services/aiService';

export default defineEventHandler(async (event) => {
  return await AIService.generateInsights();
});
