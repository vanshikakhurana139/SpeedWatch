import { VoiceCommandOverlay } from '../components/VoiceCommandOverlay';
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { Colors, Typography, Spacing } from '../theme';
import { useTripStore } from '../store/tripStore';
import { Speedometer } from '../components/Speedometer';
import { StatusBand } from '../components/StatusBand';
import { MetricTile } from '../components/MetricTile';
import apiClient from '../api/client';

export const ActiveTripScreen = ({ navigation }) => {
    useKeepAwake(); // Keep screen awake during trip

    const {
        currentTrip,
        currentSpeed,
        currentZone,
        currentLimit,
        status,
        tripViolations,
        tripPenalty,
        violationsToday,
        todayPenalty,
        startTrip,
        endTrip,
        supervisorMessage,
        setSupervisorMessage,
        triggerSOS,
    } = useTripStore();

    const [tripStarted, setTripStarted] = useState(false);
    const [tripDuration, setTripDuration] = useState(0);

    // Voice incident button
    const [recording, setRecording] = useState(false);
    const [incidentText, setIncidentText] = useState('');

    useEffect(() => {
        // Trip duration timer
        let interval;
        if (tripStarted && currentTrip) {
            interval = setInterval(() => {
                const elapsed = Math.floor(
                    (Date.now() - currentTrip.startTime.getTime()) / 1000
                );
                setTripDuration(elapsed);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [tripStarted, currentTrip]);

    const handleStartTrip = async () => {
        Alert.alert(
            'Start Trip',
            'Are you ready to start your trip? Speed monitoring will begin immediately.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start',
                    onPress: async () => {
                        const success = await startTrip();
                        if (success) {
                            setTripStarted(true);
                        } else {
                            Alert.alert('Error', 'Failed to start trip. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleEndTrip = async () => {
        Alert.alert(
            'End Trip',
            'Are you sure you want to end this trip?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Trip',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await endTrip();
                        if (result) {
                            setTripStarted(false);
                            // Show summary
                            Alert.alert(
                                'Trip Complete',
                                `Violations: ${result.violation_count}\nTotal Penalty: Rs. ${result.total_penalty}\nMax Speed: ${Math.round(result.max_speed)} km/h`,
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => navigation.replace('VehicleSelection'),
                                    },
                                ]
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleSOS = () => {
        Alert.alert(
            '🚨 EMERGENCY ALERT',
            'This will send your location to all supervisors immediately.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send SOS',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await triggerSOS();
                        if (success) {
                            Alert.alert('SOS Sent', 'Emergency alert sent to supervisors');
                        } else {
                            Alert.alert('Error', 'Failed to send SOS. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!tripStarted) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.preStartContainer}>
                    <Text style={styles.preStartTitle}>READY TO START</Text>
                    <Text style={styles.preStartSubtitle}>
                        Speed monitoring will begin when you start your trip
                    </Text>

                    <View style={styles.preStartMetrics}>
                        <View style={styles.preStartMetric}>
                            <Text style={styles.preStartMetricLabel}>VEHICLE</Text>
                            <Text style={styles.preStartMetricValue}>
                                {useTripStore.getState().currentVehicle?.license_plate || 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.preStartMetric}>
                            <Text style={styles.preStartMetricLabel}>LOAD TYPE</Text>
                            <Text style={styles.preStartMetricValue}>
                                {useTripStore.getState().loadType.toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.preStartMetric}>
                            <Text style={styles.preStartMetricLabel}>VIOLATIONS TODAY</Text>
                            <Text style={styles.preStartMetricValue}>{violationsToday}</Text>
                        </View>
                    </View>

                    {violationsToday >= 5 && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningTitle}>⚠ TRAINING REQUIRED</Text>
                            <Text style={styles.warningText}>
                                You have reached 5 violations today. Please complete safety
                                training before your next trip.
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.startTripButton}
                        onPress={handleStartTrip}
                        disabled={violationsToday >= 5}
                    >
                        <Text style={styles.startTripButtonText}>START TRIP</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // In the tripStarted === true return:
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <VoiceCommandOverlay
                message={supervisorMessage}
                onAcknowledge={() => setSupervisorMessage(null)}
            />

            {/* SOS — positioned absolutely */}
            <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                <Text style={styles.sosIcon}>🚨</Text>
                <Text style={styles.sosButtonText}>SOS</Text>
            </TouchableOpacity>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Duration header */}
                <View style={styles.durationHeader}>
                    <View style={styles.durationBlock}>
                        <Text style={styles.durationLabel}>TRIP DURATION</Text>
                        <Text style={styles.durationValue}>{formatDuration(tripDuration)}</Text>
                    </View>
                    <View style={styles.durationDivider} />
                    <View style={styles.durationBlock}>
                        <Text style={styles.durationLabel}>STATUS</Text>
                        <Text style={[styles.statusChip, {
                            color: status === 'violation' ? '#F0414B' : status === 'warning' ? '#F5A623' : '#16C974',
                        }]}>
                            {status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Speedometer */}
                <View style={styles.speedometerContainer}>
                    <Speedometer speed={currentSpeed} limit={currentLimit} status={status} />
                </View>

                {/* Status band */}
                <StatusBand status={status} zone={currentZone} limit={currentLimit} />

                {/* Metrics */}
                <View style={styles.metricsRow}>
                    <MetricTile label="VIOLATIONS" value={tripViolations} color={tripViolations > 0 ? '#F0414B' : Colors.text.primary} />
                    <View style={{ width: 12 }} />
                    <MetricTile label="PENALTY" value={`₹${tripPenalty}`} color={tripPenalty > 0 ? '#F0414B' : Colors.text.primary} />
                </View>

                {/* Today card */}
                <View style={styles.todayCard}>
                    <Text style={styles.todayCardTitle}>TODAY'S TOTAL</Text>
                    <View style={styles.todayRow}>
                        <View style={styles.todayStat}>
                            <Text style={[styles.todayStatVal, violationsToday > 3 && { color: '#F0414B' }]}>{violationsToday}</Text>
                            <Text style={styles.todayStatLabel}>Violations</Text>
                        </View>
                        <View style={styles.todayDivider} />
                        <View style={styles.todayStat}>
                            <Text style={[styles.todayStatVal, { color: '#F0414B' }]}>₹{todayPenalty}</Text>
                            <Text style={styles.todayStatLabel}>Penalty</Text>
                        </View>
                    </View>
                    {/* Progress to lockout */}
                    <View style={styles.lockoutRow}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <View key={n} style={[styles.lockoutSegment, n <= violationsToday && styles.lockoutSegmentFilled]} />
                        ))}
                    </View>
                    <Text style={styles.lockoutText}>
                        {violationsToday >= 5
                            ? '🔒 Training required before next trip'
                            : violationsToday >= 4
                                ? `⚠ 1 more violation = training lockout`
                                : `${5 - violationsToday} violations until lockout`}
                    </Text>
                </View>

                {/* Voice incident button */}
                <TouchableOpacity
                    style={[styles.incidentBtn, recording && styles.incidentBtnRecording]}
                    onPress={async () => {
                        if (recording) {
                            setRecording(false)
                            // In production: use expo-speech-recognition or SpeechRecognition
                            // For now: show text input modal
                            Alert.prompt(
                                '🎤 Incident Report',
                                'Describe the incident:',
                                async (text) => {
                                    if (text && text.trim()) {
                                        const { currentTrip, currentVehicle, currentLocation } = useTripStore.getState()
                                        if (currentTrip && currentVehicle) {
                                            try {
                                                await apiClient.post('/api/incidents/', {
                                                    vehicle_id: currentVehicle.id,
                                                    trip_id: currentTrip.id,
                                                    transcript: text.trim(),
                                                    lat: currentLocation?.lat || 0,
                                                    lng: currentLocation?.lng || 0,
                                                })
                                                Alert.alert('✅ Incident Logged', 'Supervisor has been notified.')
                                            } catch (err) {
                                                Alert.alert('Error', 'Could not log incident. Try again.')
                                            }
                                        }
                                    }
                                },
                                'plain-text'
                            )
                        } else {
                            setRecording(true)
                            setTimeout(() => setRecording(false), 5000) // 5 second timeout
                        }
                    }}
                >
                    <Text style={styles.incidentBtnIcon}>{recording ? '⏹' : '🎤'}</Text>
                    <Text style={styles.incidentBtnText}>{recording ? 'TAP TO STOP' : 'REPORT INCIDENT'}</Text>
                </TouchableOpacity>

                {/* End trip button */}
                <TouchableOpacity style={styles.endBtn} onPress={handleEndTrip}>
                    <Text style={styles.endBtnText}>■ END TRIP</Text>
                </TouchableOpacity>

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    sosButton: {
        position: 'absolute', top: 16, right: 16,
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#C0182B',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 999,
        shadowColor: '#C0182B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
    },
    sosIcon: { fontSize: 20 },
    sosButtonText: {
        fontSize: 10, fontWeight: '800', color: 'white', letterSpacing: 1,
    },
    scrollContent: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        alignItems: 'center',
    },
    headerLabel: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        fontWeight: Typography.sans.weights.semibold,
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
    },
    headerValue: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.mono.sizes.large,
        fontWeight: '700',
        color: Colors.text.primary,
        marginTop: Spacing.xs,
    },
    durationHeader: {
        flexDirection: 'row', alignItems: 'center',
        margin: 16, marginBottom: 0,
        backgroundColor: Colors.background.card,
        borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: Colors.border,
    },
    durationBlock: { flex: 1, alignItems: 'center' },
    durationDivider: { width: 1, height: 40, backgroundColor: Colors.border },
    durationLabel: {
        fontSize: 10, fontWeight: '700',
        color: Colors.text.tertiary, letterSpacing: 1.5,
        marginBottom: 4,
    },
    durationValue: {
        fontFamily: Typography.mono.family,
        fontSize: 22, fontWeight: '700', color: Colors.text.primary,
    },
    statusChip: {
        fontSize: 14, fontWeight: '800',
        letterSpacing: 1,
    },
    speedometerContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    metricsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    todayCard: {
        margin: 16, marginTop: 12,
        backgroundColor: Colors.background.card,
        borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: Colors.border,
    },
    todayCardTitle: {
        fontSize: 10, fontWeight: '700', color: Colors.text.tertiary,
        letterSpacing: 1.5, marginBottom: 12,
    },
    todayRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 },
    todayStat: { alignItems: 'center' },
    todayStatVal: {
        fontFamily: Typography.mono.family, fontSize: 28, fontWeight: '700', color: Colors.text.primary,
    },
    todayStatLabel: { fontSize: 11, color: Colors.text.tertiary, marginTop: 4 },
    todayDivider: { width: 1, height: 48, backgroundColor: Colors.border },
    lockoutRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
    lockoutSegment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.background.secondary },
    lockoutSegmentFilled: { backgroundColor: '#F0414B' },
    lockoutText: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'center' },
    todayContainer: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        backgroundColor: Colors.background.secondary,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
    },
    todayLabel: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        fontWeight: Typography.sans.weights.semibold,
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
        marginBottom: Spacing.md,
    },
    todayMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    todayMetric: {
        alignItems: 'center',
    },
    todayMetricValue: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.mono.sizes.large,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    todayMetricLabel: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
        marginTop: Spacing.xs,
    },
    todayDividerOld: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border,
    },
    todayWarning: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.caption,
        color: Colors.status.warning,
        textAlign: 'center',
        marginTop: Spacing.md,
        fontWeight: Typography.sans.weights.semibold,
    },
    endTripButton: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
        backgroundColor: Colors.status.violation,
        borderRadius: 8,
        paddingVertical: Spacing.md + 2,
        alignItems: 'center',
    },
    endTripButtonText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.inverse,
        letterSpacing: 1,
    },
    endBtn: {
        margin: 16, marginTop: 4,
        backgroundColor: '#F0414B',
        borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    },
    endBtnText: {
        fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: 2,
    },
    // Pre-start styles
    preStartContainer: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        justifyContent: 'center',
    },
    preStartTitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.title,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.primary,
        textAlign: 'center',
        letterSpacing: 1,
    },
    preStartSubtitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    preStartMetrics: {
        marginTop: Spacing.xxl,
        gap: Spacing.md,
    },
    preStartMetric: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
    },
    preStartMetricLabel: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        fontWeight: Typography.sans.weights.semibold,
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
    },
    preStartMetricValue: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.mono.sizes.medium,
        fontWeight: '700',
        color: Colors.text.primary,
        marginTop: Spacing.xs,
    },
    warningBox: {
        marginTop: Spacing.lg,
        backgroundColor: `${Colors.status.warning}20`,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Colors.status.warning,
        padding: Spacing.md,
    },
    warningTitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.status.warning,
        marginBottom: Spacing.xs,
    },
    warningText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.caption,
        color: Colors.text.secondary,
    },
    startTripButton: {
        marginTop: Spacing.xxl,
        backgroundColor: Colors.status.safe,
        borderRadius: 8,
        paddingVertical: Spacing.md + 4,
        alignItems: 'center',
    },
    startTripButtonText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.heading,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.inverse,
        letterSpacing: 1,
    },
    incidentBtn: {
        margin: 16, marginTop: 0, marginBottom: 0,
        backgroundColor: Colors.background.card,
        borderRadius: 12, paddingVertical: 14,
        alignItems: 'center', flexDirection: 'row',
        justifyContent: 'center', gap: 8,
        borderWidth: 1.5, borderColor: Colors.border,
    },
    incidentBtnRecording: { borderColor: '#F0414B', backgroundColor: 'rgba(240,65,75,0.05)' },
    incidentBtnIcon: { fontSize: 18 },
    incidentBtnText: { fontSize: 14, fontWeight: '700', color: Colors.text.secondary, letterSpacing: 0.5 },
});