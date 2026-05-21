import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_VIOLATIONS_KEY = '@speedwatch/offline_violations';
const GEOFENCES_CACHE_KEY = '@speedwatch/geofences_cache';

// Get all unsynced violations
export const getUnsyncedViolations = async () => {
    try {
        const data = await AsyncStorage.getItem(OFFLINE_VIOLATIONS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting unsynced violations:', error);
        return [];
    }
};

// Save violation offline
export const saveOfflineViolation = async (violation) => {
    try {
        const existing = await getUnsyncedViolations();
        existing.push(violation);
        await AsyncStorage.setItem(OFFLINE_VIOLATIONS_KEY, JSON.stringify(existing));
    } catch (error) {
        console.error('Error saving offline violation:', error);
    }
};

// Mark violation as synced (remove from queue)
export const markViolationSynced = async (id) => {
    try {
        let violations = await getUnsyncedViolations();
        violations = violations.filter(v => v.id !== id);
        await AsyncStorage.setItem(OFFLINE_VIOLATIONS_KEY, JSON.stringify(violations));
    } catch (error) {
        console.error('Error marking violation synced:', error);
    }
};

// Increment sync attempt (optional, we'll just remove on success)
export const incrementSyncAttempt = async (id) => {
    // Not needed with AsyncStorage, but keep as no-op
};

// Save geofences to cache
export const cacheGeofences = async (geofences) => {
    try {
        await AsyncStorage.setItem(GEOFENCES_CACHE_KEY, JSON.stringify(geofences));
    } catch (error) {
        console.error('Error caching geofences:', error);
    }
};

// Get cached geofences
export const getCachedGeofences = async () => {
    try {
        const data = await AsyncStorage.getItem(GEOFENCES_CACHE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting cached geofences:', error);
        return [];
    }
};

// Initialize database (no‑op for AsyncStorage)
export const initDatabase = async () => {
    console.log('Using AsyncStorage for offline storage');
    return Promise.resolve();
};