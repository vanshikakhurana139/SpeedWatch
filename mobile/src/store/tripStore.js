import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tripsApi } from '../api/trips';
import { violationsApi } from '../api/violations';
import { sosApi } from '../api/sos';
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
    ws: null,
    supervisorMessage: null,

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
    setSupervisorMessage: (message) => set({ supervisorMessage: message }),

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

            // Connect WebSocket
            await get().connectWebSocket(data.trip_id);

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

            // Disconnect WebSocket
            get().disconnectWebSocket();

            // End trip on server
            const data = await tripsApi.endTrip(currentTrip.id);

            set({
                currentTrip: null,
                isTracking: false,
                currentSpeed: 0,
                status: 'safe',
                supervisorMessage: null,
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

    connectWebSocket: async (tripId) => {
        get().disconnectWebSocket();

        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                console.error('No auth token found for WS connection');
                return;
            }

            const { WS_CONFIG } = require('../config/api');
            const wsUrl = `${WS_CONFIG.BASE_URL}${WS_CONFIG.ENDPOINTS.DRIVER}?token=${token}&trip_id=${tripId}`;
            console.log('Driver WS connecting to:', wsUrl);

            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('Driver WS connection established');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Driver WS received message:', data);

                    if (data.type === 'voice_command') {
                        set({ supervisorMessage: data.message });
                    }
                } catch (err) {
                    console.error('Failed to parse driver WS message:', err);
                }
            };

            ws.onerror = (error) => {
                console.error('Driver WS error:', error);
            };

            ws.onclose = (event) => {
                console.log('Driver WS connection closed:', event.code, event.reason);
                // Auto-reconnect if tracking is still active
                if (get().isTracking && get().currentTrip?.id === tripId) {
                    console.log('Reconnecting Driver WS in 3 seconds...');
                    setTimeout(() => {
                        if (get().isTracking) {
                            get().connectWebSocket(tripId);
                        }
                    }, 3000);
                }
            };

            set({ ws });
        } catch (error) {
            console.error('Failed to initialize Driver WS connection:', error);
        }
    },

    disconnectWebSocket: () => {
        const { ws } = get();
        if (ws) {
            try {
                ws.close();
            } catch (err) {
                console.error('Error closing Driver WS:', err);
            }
            set({ ws: null });
        }
    },

    triggerSOS: async () => {
        const { currentTrip, currentVehicle, currentLocation } = get();
        if (!currentTrip || !currentVehicle) return false;

        let lat = 0.0;
        let lng = 0.0;
        if (currentLocation) {
            lat = currentLocation.lat;
            lng = currentLocation.lng;
        } else {
            try {
                const location = await GPSService.getCurrentLocation();
                if (location) {
                    lat = location.lat;
                    lng = location.lng;
                }
            } catch (err) {
                console.error('Failed to get fallback GPS location for SOS:', err);
            }
        }

        try {
            await sosApi.sendSOS({
                vehicle_id: currentVehicle.id,
                trip_id: currentTrip.id,
                lat,
                lng,
            });
            return true;
        } catch (error) {
            console.error('Error sending SOS:', error);
            return false;
        }
    },
}));