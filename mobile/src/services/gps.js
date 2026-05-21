import * as Location from 'expo-location';
import { Platform } from 'react-native';

class GPSService {
    constructor() {
        this.locationSubscription = null;
        this.lastKnownLocation = null;
        this.speedReadings = []; // For 3-reading moving average
    }

    // Request location permissions
    async requestPermissions() {
        try {
            // Request foreground permission first
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

            if (foregroundStatus !== 'granted') {
                throw new Error('Location permission denied');
            }

            // Request background permission (needed for active trips)
            if (Platform.OS === 'android') {
                const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
                if (backgroundStatus !== 'granted') {
                    console.warn('Background location permission denied');
                }
            }

            return true;
        } catch (error) {
            console.error('Error requesting location permissions:', error);
            return false;
        }
    }

    // Check if permissions are granted
    async hasPermissions() {
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
    }

    // Start tracking location
    async startTracking(onLocationUpdate) {
        try {
            // Stop any existing subscription
            this.stopTracking();

            // Start watching position with high accuracy
            this.locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 2000, // Update every 2 seconds
                    distanceInterval: 5, // Or every 5 meters
                },
                (location) => {
                    this.lastKnownLocation = location;

                    // Calculate smoothed speed (3-reading moving average)
                    const currentSpeed = location.coords.speed || 0;
                    this.speedReadings.push(currentSpeed);
                    if (this.speedReadings.length > 3) {
                        this.speedReadings.shift(); // Keep only last 3 readings
                    }

                    const averageSpeed = this.speedReadings.reduce((a, b) => a + b, 0) / this.speedReadings.length;

                    // Convert m/s to km/h
                    const speedKmh = averageSpeed * 3.6;

                    // Call the callback with processed data
                    onLocationUpdate({
                        lat: location.coords.latitude,
                        lng: location.coords.longitude,
                        speed: Math.max(0, speedKmh), // Ensure non-negative
                        accuracy: location.coords.accuracy,
                        heading: location.coords.heading,
                        timestamp: location.timestamp,
                    });
                }
            );

            return true;
        } catch (error) {
            console.error('Error starting location tracking:', error);
            return false;
        }
    }

    // Stop tracking
    stopTracking() {
        if (this.locationSubscription) {
            this.locationSubscription.remove();
            this.locationSubscription = null;
        }
        this.speedReadings = [];
    }

    // Get current location once
    async getCurrentLocation() {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            return {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                speed: (location.coords.speed || 0) * 3.6, // m/s to km/h
                accuracy: location.coords.accuracy,
            };
        } catch (error) {
            console.error('Error getting current location:', error);
            return null;
        }
    }

    // Get last known location (cached)
    getLastKnownLocation() {
        if (!this.lastKnownLocation) return null;

        return {
            lat: this.lastKnownLocation.coords.latitude,
            lng: this.lastKnownLocation.coords.longitude,
            speed: (this.lastKnownLocation.coords.speed || 0) * 3.6,
            accuracy: this.lastKnownLocation.coords.accuracy,
        };
    }
}

// Singleton instance
export default new GPSService();