
import { AIService } from '../../services/aiService';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return {
    response: await AIService.chat(body.message)
  };
});
