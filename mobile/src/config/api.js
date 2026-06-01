// Backend API configuration
// IMPORTANT: Replace this with your actual backend IP address

const getApiBaseUrl = () => {
    // For development on Windows with Expo Go:
    // 1. Find your computer's local IP: Open CMD and type 'ipconfig'
    // 2. Look for "IPv4 Address" under your active network adapter
    // 3. It will look like: 192.168.1.xxx or 10.0.0.xxx

    // Example: If your computer IP is 192.168.1.100 and backend runs on port 8000:
    return 'http://172.16.74.193:8000';  // ⚠️ CHANGE THIS TO YOUR IP
};

export const API_CONFIG = {
    BASE_URL: getApiBaseUrl(),
    ENDPOINTS: {
        // Auth
        LOGIN: '/api/auth/login',
        ME: '/api/auth/me',
        FCM_TOKEN: '/api/auth/fcm-token',

        // Vehicles
        VEHICLES: '/api/vehicles',

        // Trips
        START_TRIP: '/api/trips/start',
        END_TRIP: (tripId) => `/api/trips/${tripId}/end`,
        UPDATE_POSITION: (tripId) => `/api/trips/${tripId}/position`,

        // Violations
        LOG_VIOLATION: '/api/violations',
        GET_VIOLATIONS: '/api/violations',

        // Geofences
        GEOFENCES: '/api/geofences',

        // SOS
        SOS: '/api/sos',
    },
    TIMEOUT: 10000, // 10 seconds
};

export const WS_CONFIG = {
    BASE_URL: getApiBaseUrl().replace('http', 'ws'),
    ENDPOINTS: {
        DRIVER: '/ws/driver',
    },
};