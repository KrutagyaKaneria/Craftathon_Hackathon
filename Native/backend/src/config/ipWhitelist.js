/**
 * IP Whitelist Configuration
 * Manages allowed IPs/URLs for CORS and client connections
 * 
 * Usage: 
 * - Define in .env: ALLOWED_IPS=10.44.202.155,192.168.1.100
 * - Define in .env: ALLOWED_URLS=http://localhost:3000,http://myapp.com
 */

import dotenv from 'dotenv';
dotenv.config();

class IPWhitelist {
  constructor() {
    this.loadConfiguration();
  }

  loadConfiguration() {
    // Parse allowed IPs from environment
    const allowedIPsEnv = process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];
    
    // Parse allowed URLs from environment
    const allowedURLsEnv = process.env.ALLOWED_URLS?.split(',').map(url => url.trim()) || [];
    
    // Parse IP patterns (e.g., "10.", "192.168.")
    const ipPatternsEnv = process.env.IP_PATTERNS?.split(',').map(pattern => pattern.trim()) || [];

    // Default configurations
    this.defaultLocalHosts = [
      'localhost',
      '127.0.0.1',
    ];

    this.defaultLocalPatterns = [
      '10.44.202.155',
      '192.168.',     // Private network
      '10.',          // Private network
      '172.16.',      // Private network
      '169.254.',     // Link-local
    ];

    this.defaultPorts = [
      3000,           // React dev
      5173,           // Vite dev
      8081,           // Expo web
      19000,          // Expo dev
      19001,          // Expo dev
      8000,           // Django/FastAPI
      5000,           // Flask/Backend
      3001,           // Next.js
      8080,           // Webpack dev
    ];

    this.allowedIPs = allowedIPsEnv;
    this.allowedURLs = allowedURLsEnv;
    this.ipPatterns = ipPatternsEnv.length > 0 ? ipPatternsEnv : this.defaultLocalPatterns;

    // Build complete allowed origins list
    this.allowedOrigins = this.buildAllowedOrigins();

    console.log('📋 IP Whitelist Configuration Loaded:');
    console.log('   Allowed IPs:', this.allowedIPs.length > 0 ? this.allowedIPs : 'None (using patterns)');
    console.log('   IP Patterns:', this.ipPatterns);
    console.log('   Allowed URLs:', this.allowedURLs);
    console.log('   Total Allowed Origins:', this.allowedOrigins.length);
  }

  buildAllowedOrigins() {
    const origins = new Set();

    // Add default localhost URLs
    this.defaultPorts.forEach(port => {
      this.defaultLocalHosts.forEach(host => {
        origins.add(`http://${host}:${port}`);
      });
    });

    // Add configured IPs with default ports
    this.allowedIPs.forEach(ip => {
      this.defaultPorts.forEach(port => {
        origins.add(`http://${ip}:${port}`);
      });
    });

    // Add configured URLs
    this.allowedURLs.forEach(url => {
      origins.add(url);
    });

    return Array.from(origins);
  }

  /**
   * Check if an origin is allowed
   * @param {string} origin - The origin URL to check
   * @param {boolean} isDevelopment - Whether in development mode
   * @returns {boolean}
   */
  isOriginAllowed(origin, isDevelopment = false) {
    if (!origin) {
      // No origin (native mobile apps, curl, etc.) - allow by default
      return true;
    }

    // Check exact match
    if (this.allowedOrigins.includes(origin)) {
      return true;
    }

    // In development, allow any IP matching patterns
    if (isDevelopment) {
      for (const pattern of this.ipPatterns) {
        if (origin.includes(pattern)) {
          return true;
        }
      }

      // Allow localhost in development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get CORS origin callback
   * @param {boolean} isDevelopment - Whether in development mode
   * @returns {function}
   */
  getCorsCallback(isDevelopment = process.env.NODE_ENV !== 'production') {
    return (origin, callback) => {
      if (this.isOriginAllowed(origin, isDevelopment)) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked origin: ${origin}`);
        callback(new Error('CORS: Origin not allowed'));
      }
    };
  }

  /**
   * Get formatted list of allowed origins for logging
   * @returns {string}
   */
  getAllowedOriginsFormatted() {
    return this.allowedOrigins.map(o => `  ✓ ${o}`).join('\n');
  }

  /**
   * Add a temporary allowed IP (for testing)
   * @param {string} ip - IP address to allow
   * @param {number} port - Port number
   */
  addTemporaryIP(ip, port = 5000) {
    const origin = `http://${ip}:${port}`;
    if (!this.allowedOrigins.includes(origin)) {
      this.allowedOrigins.push(origin);
      console.log(`✅ Temporarily added IP: ${origin}`);
    }
  }

  /**
   * Get configuration as JSON for client
   * @returns {object}
   */
  getClientConfig() {
    return {
      backendURL: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
      allowedIPs: this.allowedIPs,
      supportedPorts: this.defaultPorts,
      development: process.env.NODE_ENV !== 'production',
    };
  }
}

export const ipWhitelist = new IPWhitelist();
