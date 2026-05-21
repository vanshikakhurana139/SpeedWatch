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
    } = useTripStore();

    const [tripStarted, setTripStarted] = useState(false);
    const [tripDuration, setTripDuration] = useState(0);

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
                    onPress: () => {
                        // TODO: Implement SOS API call
                        Alert.alert('SOS Sent', 'Emergency alert sent to supervisors');
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* SOS Button */}
            <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                <Text style={styles.sosButtonText}>SOS</Text>
            </TouchableOpacity>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Info */}
                <View style={styles.header}>
                    <Text style={styles.headerLabel}>TRIP DURATION</Text>
                    <Text style={styles.headerValue}>{formatDuration(tripDuration)}</Text>
                </View>

                {/* Speedometer */}
                <View style={styles.speedometerContainer}>
                    <Speedometer speed={currentSpeed} limit={currentLimit} status={status} />
                </View>

                {/* Status Band */}
                <StatusBand status={status} zone={currentZone} limit={currentLimit} />

                {/* Metrics Row */}
                <View style={styles.metricsRow}>
                    <MetricTile
                        label="VIOLATIONS"
                        value={tripViolations}
                        color={tripViolations > 0 ? Colors.status.violation : Colors.text.primary}
                    />
                    <MetricTile
                        label="PENALTY"
                        value={tripPenalty}
                        unit="Rs."
                        color={tripPenalty > 0 ? Colors.status.violation : Colors.text.primary}
                    />
                </View>

                {/* Today's Total */}
                <View style={styles.todayContainer}>
                    <Text style={styles.todayLabel}>TODAY'S TOTAL</Text>
                    <View style={styles.todayMetrics}>
                        <View style={styles.todayMetric}>
                            <Text style={styles.todayMetricValue}>{violationsToday}</Text>
                            <Text style={styles.todayMetricLabel}>Violations</Text>
                        </View>
                        <View style={styles.todayDivider} />
                        <View style={styles.todayMetric}>
                            <Text style={styles.todayMetricValue}>Rs. {todayPenalty}</Text>
                            <Text style={styles.todayMetricLabel}>Penalty</Text>
                        </View>
                    </View>
                    {violationsToday >= 4 && (
                        <Text style={styles.todayWarning}>
                            ⚠ Warning: {5 - violationsToday} violation(s) until lockout
                        </Text>
                    )}
                </View>

                {/* End Trip Button */}
                <TouchableOpacity style={styles.endTripButton} onPress={handleEndTrip}>
                    <Text style={styles.endTripButtonText}>END TRIP</Text>
                </TouchableOpacity>

                <View style={{ height: Spacing.xl }} />
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
        position: 'absolute',
        top: 60,
        right: Spacing.lg,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.status.critical,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    sosButtonText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.caption,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.primary,
        letterSpacing: 0.5,
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
    speedometerContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    metricsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
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
    todayDivider: {
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
        color: Colors.text.primary,
        letterSpacing: 1,
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
});