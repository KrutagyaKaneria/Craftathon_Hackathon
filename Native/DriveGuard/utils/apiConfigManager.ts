/**
 * API Configuration Manager
 * Handles API URL detection, configuration, and health checks
 */

export type APIConfig = {
  baseURL: string;
  timeout: number;
  isDevelopment: boolean;
};

class APIConfigManager {
  private config: APIConfig;
  private healthCheckCache: { timestamp: number; isHealthy: boolean } | null = null;
  private healthCheckCacheDuration = 5000; // 5 seconds

  constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Load API configuration from environment or use defaults
   */
  private loadConfiguration(): APIConfig {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.44.202.155:5000';
    
    console.log('🔧 API Configuration Loaded:');
    console.log(`   Base URL: ${apiUrl}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

    return {
      baseURL: apiUrl,
      timeout: 60000,
      isDevelopment: process.env.NODE_ENV !== 'production' || process.env.EXPO_PUBLIC_DEBUG === 'true',
    };
  }

  /**
   * Get the current API configuration
   */
  getConfig(): APIConfig {
    return this.config;
  }

  /**
   * Update the API base URL
   */
  updateBaseURL(newURL: string): void {
    this.config.baseURL = newURL;
    this.clearHealthCheckCache();
    console.log(`✅ API Base URL updated to: ${newURL}`);
  }

  /**
   * Check if backend is healthy by calling health endpoint
   */
  async checkHealthStatus(): Promise<boolean> {
    // Return cached result if still valid
    if (this.healthCheckCache) {
      const now = Date.now();
      if (now - this.healthCheckCache.timestamp < this.healthCheckCacheDuration) {
        return this.healthCheckCache.isHealthy;
      }
    }

    try {
      const healthURL = `${this.config.baseURL}/api/health`;
      const response = await fetch(healthURL, {
        method: 'GET',
        timeout: this.config.timeout / 2, // Half the normal timeout for health checks
      });

      const isHealthy = response.ok;
      
      // Cache the result
      this.healthCheckCache = {
        timestamp: Date.now(),
        isHealthy,
      };

      if (isHealthy) {
        console.log(`✅ Backend health check passed: ${this.config.baseURL}`);
      } else {
        console.warn(`❌ Backend health check failed: ${response.status} ${response.statusText}`);
      }

      return isHealthy;
    } catch (error: any) {
      console.error('❌ Backend health check error:', {
        url: this.config.baseURL,
        error: error.message,
        errno: error.errno,
      });

      // Cache the failure
      this.healthCheckCache = {
        timestamp: Date.now(),
        isHealthy: false,
      };

      return false;
    }
  }

  /**
   * Clear health check cache
   */
  private clearHealthCheckCache(): void {
    this.healthCheckCache = null;
  }

  /**
   * Get detailed troubleshooting information
   */
  async getTroubleshootingInfo(): Promise<object> {
    const isHealthy = await this.checkHealthStatus();

    return {
      apiURL: this.config.baseURL,
      isHealthy,
      isDevelopment: this.config.isDevelopment,
      suggestions: this.getSuggestions(isHealthy),
      checklist: this.getTroubleshootingChecklist(),
    };
  }

  /**
   * Get suggestions based on health status
   */
  private getSuggestions(isHealthy: boolean): string[] {
    if (isHealthy) {
      return ['✅ Backend is running correctly'];
    }

    return [
      '1. Check if backend server is running:',
      `   npm run dev (in backend folder)`,
      `   Or: node src/server.js`,
      '',
      '2. Verify the backend IP address:',
      `   Current: ${this.config.baseURL}`,
      '   Windows:  ipconfig (look for IPv4 Address)',
      '   Mac/Linux: ifconfig or hostname -I',
      '',
      '3. Update the API URL if IP changed:',
      `   Edit: .env file in DriveGuard folder`,
      `   Set: EXPO_PUBLIC_API_URL=http://YOUR_IP:5000`,
      '',
      '4. Check network connectivity:',
      '   Ping the backend: ping 10.44.202.155',
      '   Or visit: http://10.44.202.155:5000/api/health in browser',
    ];
  }

  /**
   * Get troubleshooting checklist
   */
  private getTroubleshootingChecklist(): object {
    return {
      'Backend Running': {
        test: 'npm run dev in backend folder',
        expected: 'Server started on port 5000',
      },
      'Database Connected': {
        test: 'Check MongoDB Atlas connection',
        expected: 'MongoDB connected in console logs',
      },
      'Network Accessible': {
        test: `Visit http://10.44.202.155:5000/api/health`,
        expected: '{"status":"Backend is running","timestamp":"..."}',
      },
      'Correct IP Configured': {
        test: 'Check .env EXPO_PUBLIC_API_URL',
        expected: 'Should match your machine IP + port 5000',
      },
    };
  }

  /**
   * Generate API configuration string for sharing
   */
  generateConfigString(): string {
    return `
📋 API CONFIGURATION
==================
Base URL: ${this.config.baseURL}
Timeout: ${this.config.timeout}ms
Development: ${this.config.isDevelopment}

.env Configuration:
EXPO_PUBLIC_API_URL=${this.config.baseURL}
`.trim();
  }
}

// Export singleton instance
export const apiConfigManager = new APIConfigManager();
