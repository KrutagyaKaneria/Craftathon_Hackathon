import { apiService } from './api.js';

export const aiService = {
  detectFatigue: (payload) => apiService.detectFatigue(payload),

  detectRash: (payload) => apiService.detectRash(payload),
};

export default aiService;