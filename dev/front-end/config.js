// Toasté Bike Polo Configuration
// Export configuration
window.TOASTE_CONFIG = {
    apiBaseUrl: 'https://api.toastebikepolo.ca',
    domain: window.location.hostname.includes('toastebikepolo.com') ? 'com' : 'ca',
    isProduction: !window.location.hostname.includes('localhost')
};
