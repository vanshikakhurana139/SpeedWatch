// frontend/src/store/dashboardStore.js
// Replace your existing dashboardStore.js with this complete version

import { create } from 'zustand'

export const useDashboardStore = create((set, get) => ({
    // ── Vehicle positions ────────────────────────────────────────────────
    // { vehicleId: { lat, lng, speed, status, driverId, driverName, tripId, lastUpdate } }
    vehiclePositions: {},

    updateVehiclePosition: (data) =>
        set((s) => ({
            vehiclePositions: {
                ...s.vehiclePositions,
                [data.vehicle_id]: {
                    lat: data.lat,
                    lng: data.lng,
                    speed: data.speed || 0,
                    status: data.status || 'safe',
                    driverId: data.driver_id,
                    driverName: data.driver_name || 'Unknown Driver',
                    tripId: data.trip_id,
                    lastUpdate: Date.now(),
                },
            },
        })),

    removeVehicle: (vehicleId) =>
        set((s) => {
            const next = { ...s.vehiclePositions }
            delete next[vehicleId]
            return { vehiclePositions: next }
        }),

    // ── Violations live feed ─────────────────────────────────────────────
    violations: [],

    addViolation: (v) =>
        set((s) => ({
            violations: [
                { ...v, _id: Date.now() + Math.random(), receivedAt: Date.now() },
                ...s.violations,
            ].slice(0, 200),
        })),

    // ── Hourly chart data ────────────────────────────────────────────────
    hourlyViolationCounts: {},

    incrementHourlyCount: () => {
        const hour = new Date().getHours().toString()
        set((s) => ({
            hourlyViolationCounts: {
                ...s.hourlyViolationCounts,
                [hour]: (s.hourlyViolationCounts[hour] || 0) + 1,
            },
        }))
    },

    // ── SOS alerts ───────────────────────────────────────────────────────
    sosAlerts: [],

    addSosAlert: (alert) =>
        set((s) => ({
            sosAlerts: [
                { ...alert, _id: Date.now(), receivedAt: Date.now(), cleared: false },
                ...s.sosAlerts,
            ],
        })),

    clearSosAlert: (id) =>
        set((s) => ({
            sosAlerts: s.sosAlerts.map((a) => (a._id === id ? { ...a, cleared: true } : a)),
        })),

    // ── Ticker messages ──────────────────────────────────────────────────
    tickerMessages: [],

    addTickerMessage: (text) =>
        set((s) => ({
            tickerMessages: [
                { text, id: Date.now(), time: new Date().toLocaleTimeString('en-IN', { hour12: false }) },
                ...s.tickerMessages,
            ].slice(0, 30),
        })),

    // ── Selected vehicle (popup) ─────────────────────────────────────────
    selectedVehicleId: null,
    setSelectedVehicle: (id) => set({ selectedVehicleId: id }),

    // ── Trip replay ──────────────────────────────────────────────────────
    replayTripId: null,
    setReplayTripId: (id) => set({ replayTripId: id }),

    // ── WebSocket status ─────────────────────────────────────────────────
    wsConnected: false,
    setWsConnected: (v) => set({ wsConnected: v }),

    // ── Active page / nav ────────────────────────────────────────────────
    activePage: 'dashboard', // 'dashboard' | 'reports' | 'leaderboard'
    setActivePage: (page) => set({ activePage: page }),
}))