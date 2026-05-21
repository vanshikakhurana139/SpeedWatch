import { create } from 'zustand';
import { tripsApi } from '../api/trips';
import { violationsApi } from '../api/violations';
import GPSService from '../services/gps';
import AccelerometerService from '../services/accelerometer';
import { getSpeedLimitForPosition } from '../services/geofenceChecker';
import { saveOfflineViolation } from '../services/database';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

export const useTripStore = create((set, get) => ({
    // State
    currentTrip: null,
    currentVehicle: null,
    loadType: 'empty',

    // Real-time data
    currentSpeed: 0,
    currentLocation: null,
    currentZone: null,
    currentLimit: 50,

    // Violation tracking
    violationsToday: 0,
    todayPenalty: 0,
    tripViolations: 0,
    tripPenalty: 0,

    // Status
    status: 'safe', // 'safe' | 'warning' | 'violation'
    isTracking: false,
    lastViolationTime: 0,

    // Geofences
    geofences: [],

    // Actions
    setVehicle: (vehicle) => set({ currentVehicle: vehicle }),
    setLoadType: (loadType) => set({ loadType }),

    setGeofences: (geofences) => set({ geofences }),

    startTrip: async () => {
        const { currentVehicle, loadType } = get();
        if (!currentVehicle) return false;

        try {
            const data = await tripsApi.startTrip(currentVehicle.id, loadType);

            set({
                currentTrip: {
                    id: data.trip_id,
                    startTime: new Date(),
                    vehicleId: currentVehicle.id,
                },
                isTracking: true,
                tripViolations: 0,
                tripPenalty: 0,
            });

            // Start GPS tracking
            await get().startGPSTracking();

            // Start accelerometer
            AccelerometerService.start(get().handleHarshDriving);

            return true;
        } catch (error) {
            console.error('Error starting trip:', error);
            return false;
        }
    },

    endTrip: async () => {
        const { currentTrip } = get();
        if (!currentTrip) return false;

        try {
            // Stop tracking
            get().stopGPSTracking();
            AccelerometerService.stop();

            // End trip on server
            const data = await tripsApi.endTrip(currentTrip.id);

            set({
                currentTrip: null,
                isTracking: false,
                currentSpeed: 0,
                status: 'safe',
            });

            return data;
        } catch (error) {
            console.error('Error ending trip:', error);
            return null;
        }
    },

    startGPSTracking: async () => {
        const hasPermission = await GPSService.requestPermissions();
        if (!hasPermission) {
            console.error('GPS permission denied');
            return;
        }

        await GPSService.startTracking((location) => {
            get().handleLocationUpdate(location);
        });
    },

    stopGPSTracking: () => {
        GPSService.stopTracking();
    },

    handleLocationUpdate: async (location) => {
        const { currentTrip, geofences, loadType } = get();
        if (!currentTrip) return;

        const { lat, lng, speed } = location;

        // Get applicable speed limit
        const { limit, zone, insideZone } = getSpeedLimitForPosition(
            lat,
            lng,
            geofences,
            loadType
        );

        // Update current state
        set({
            currentSpeed: Math.round(speed),
            currentLocation: { lat, lng },
            currentZone: zone,
            currentLimit: limit,
        });

        // Send position to backend
        try {
            await tripsApi.updatePosition(currentTrip.id, {
                lat,
                lng,
                speed,
                accuracy: location.accuracy,
                heading: location.heading,
            });
        } catch (error) {
            console.error('Error updating position:', error);
        }

        // Check for violation
        get().checkViolation(speed, limit, { lat, lng }, zone?.id);

        // Update status based on speed
        if (speed > limit) {
            set({ status: 'violation' });
        } else if (speed > limit * 0.8) {
            set({ status: 'warning' });
        } else {
            set({ status: 'safe' });
        }
    },

    checkViolation: async (speed, limit, location, geofenceId) => {
        const { currentTrip, lastViolationTime } = get();

        // Violation threshold: speed > limit
        if (speed <= limit) return;

        // Cooldown: 8 seconds between violations
        const now = Date.now();
        if (now - lastViolationTime < 8000) return;

        // Trigger violation
        set({ lastViolationTime: now });
        await get().logViolation({
            trip_id: currentTrip.id,
            vehicle_id: currentTrip.vehicleId,
            speed_recorded: speed,
            zone_limit: limit,
            lat: location.lat,
            lng: location.lng,
            geofence_id: geofenceId,
            violation_type: 'overspeed',
        });
    },

    logViolation: async (violationData) => {
        try {
            // Try to log to server
            const response = await violationsApi.logViolation(violationData);

            // Update local state
            set((state) => ({
                violationsToday: response.today_total_violations,
                todayPenalty: response.today_total_penalty,
                tripViolations: state.tripViolations + 1,
                tripPenalty: state.tripPenalty + response.penalty_amount,
            }));

            // Play haptic and audio feedback
            get().playViolationAlert(response.penalty_amount);

            return response;
        } catch (error) {
            console.log('Offline - saving violation locally');

            // Save offline
            await saveOfflineViolation(violationData);

            // Estimate penalty locally (Rs. 100 x count)
            set((state) => ({
                tripViolations: state.tripViolations + 1,
                tripPenalty: state.tripPenalty + ((state.tripViolations + 1) * 100),
            }));

            get().playViolationAlert((get().tripViolations) * 100);
        }
    },

    handleHarshDriving: async (event) => {
        const { currentTrip, currentLocation } = get();
        if (!currentTrip || !currentLocation) return;

        // Log as a different violation type
        await get().logViolation({
            trip_id: currentTrip.id,
            vehicle_id: currentTrip.vehicleId,
            speed_recorded: get().currentSpeed,
            zone_limit: 50, // Not applicable for harsh driving
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            geofence_id: null,
            violation_type: 'harsh_driving',
        });
    },

    playViolationAlert: async (penaltyAmount) => {
        // Haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Play sound (you'll need to add audio files)
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/sounds/violation-alert.mp3')
            );
            await sound.playAsync();
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    },
}));