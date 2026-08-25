/**
 * src/config/api.js
 * -----------------------------------------------------------------
 * Centralized API configuration for the GM University Event System.
 *
 * RULE: Every component that makes a backend request MUST import
 * API_BASE from this file. Never hardcode the URL in a component.
 *
 * To change the backend URL, edit ONE line here — all components
 * update automatically.
 * -----------------------------------------------------------------
 */

export const API_BASE = 'http://localhost:8080/backend';
// export const API_BASE = 'http://172.21.3.137:8080/backend';

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const token = localStorage.getItem('jwt_token');
  if (token && resource.toString().startsWith(API_BASE)) {
    if (!config) config = {};
    if (!config.headers) config.headers = {};
    
    // Convert Headers object to plain object if needed, or use append
    if (config.headers instanceof Headers) {
      config.headers.append('Authorization', `Bearer ${token}`);
    } else {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  return originalFetch(resource, config);
};
