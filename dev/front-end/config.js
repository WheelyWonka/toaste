// Toasté Bike Polo Configuration
// This file handles multi-domain support for .com and .ca

// Detect current domain and set API URL accordingly
function getApiBaseUrl() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('toastebikepolo.com') || hostname.includes('toastebikepolo.ca')) {
        return 'https://toastebikepolo.netlify.app/.netlify/functions';
    } else {
        // Development/local fallback
        return 'http://localhost:3001/api';
    }
}

// Export configuration
window.TOASTE_CONFIG = {
    apiBaseUrl: getApiBaseUrl(),
    domain: window.location.hostname.includes('toastebikepolo.com') ? 'com' : 'ca',
    isProduction: !window.location.hostname.includes('localhost')
};
