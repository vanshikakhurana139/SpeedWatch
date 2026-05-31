import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../theme';

/**
 * TrainingScreen — shown when driver hits 5 violations in a day
 * 
 * WHY this exists: After 5 violations, the system LOCKS the driver out.
 * Before they can start another trip, they must:
 * 1. Read the safety points
 * 2. Watch the countdown (simulates 30-second safety video)
 * 3. Click "I Understand"
 * 
 * This creates a behavioural pause — the driver has to consciously
 * acknowledge the safety rules before continuing.
 */
export const TrainingScreen = ({ navigation, route }) => {
    const [step, setStep] = useState(1);        // 1=intro, 2=video, 3=checklist, 4=complete
    const [countdown, setCountdown] = useState(30);  // 30-second safety "video"
    const [videoPlaying, setVideoPlaying] = useState(false);
    const [checklistDone, setChecklistDone] = useState({
        rule1: false,
        rule2: false,
        rule3: false,
        rule4: false,
    });

    // Countdown timer for "video"
    useEffect(() => {
        let timer;
        if (videoPlaying && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            setStep(3); // Move to checklist after video
        }
        return () => clearInterval(timer);
    }, [videoPlaying, countdown]);

    const allChecked = Object.values(checklistDone).every(Boolean);

    const handleComplete = () => {
        Alert.alert(
            '✅ Training Complete',
            'You may now start your next trip. Remember: safety is your responsibility.',
            [{
                text: 'Start Driving',
                onPress: () => navigation.replace('VehicleSelection')
            }]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scroll}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.warningIcon}>⚠</Text>
                    <Text style={styles.title}>SAFETY TRAINING REQUIRED</Text>
                    <Text style={styles.subtitle}>
                        You have accumulated 5 violations today.{'\n'}
                        Complete this training before your next trip.
                    </Text>
                </View>

                {/* STEP 1: Introduction */}
                {step === 1 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>WHY ARE YOU HERE?</Text>
                        <Text style={styles.cardText}>
                            Speeding inside a steel plant puts YOU and your COLLEAGUES at risk.
                            Heavy vehicles at high speed have killed workers in industrial plants
                            across India. Today you exceeded the speed limit 5 times.
                        </Text>
                        <View style={styles.statsRow}>
                            <StatBox label="VIOLATIONS TODAY" value="5" color={Colors.status.violation} />
                            <StatBox label="PENALTY TODAY" value="₹1,500" color={Colors.status.warning} />
                        </View>
                        <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
                            <Text style={styles.nextBtnText}>WATCH SAFETY VIDEO →</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* STEP 2: Safety "Video" (30 second countdown) */}
                {step === 2 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>SAFETY AWARENESS VIDEO</Text>

                        {/* Video placeholder — in production, use expo-av with real .mp4 */}
                        <View style={styles.videoBox}>
                            {!videoPlaying ? (
                                <TouchableOpacity
                                    style={styles.playButton}
                                    onPress={() => setVideoPlaying(true)}
                                >
                                    <Text style={styles.playIcon}>▶</Text>
                                    <Text style={styles.playLabel}>TAP TO PLAY</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.videoPlaying}>
                                    <Text style={styles.countdownNum}>{countdown}</Text>
                                    <Text style={styles.countdownLabel}>seconds remaining</Text>
                                    <View style={styles.progressBar}>
                                        <View style={[
                                            styles.progressFill,
                                            { width: `${((30 - countdown) / 30) * 100}%` }
                                        ]} />
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={styles.videoPoints}>
                            {[
                                '🚫 Never exceed 50 km/h on plant roads',
                                '⚠ Reduce speed to 15 km/h near pedestrian areas',
                                '🔴 Obey all posted zone speed limits',
                                '📱 This app monitors your speed continuously',
                            ].map((point, i) => (
                                <Text key={i} style={styles.videoPoint}>{point}</Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* STEP 3: Checklist */}
                {step === 3 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>SAFETY ACKNOWLEDGEMENT</Text>
                        <Text style={styles.cardText}>
                            Tick each box to confirm you understand your responsibilities:
                        </Text>

                        {[
                            { key: 'rule1', text: 'I will not exceed 50 km/h on any plant road' },
                            { key: 'rule2', text: 'I will slow to 15 km/h near pedestrian zones' },
                            { key: 'rule3', text: 'I understand that repeat violations result in suspension' },
                            { key: 'rule4', text: 'I will report any road hazards using the incident button' },
                        ].map((item) => (
                            <TouchableOpacity
                                key={item.key}
                                style={[
                                    styles.checkItem,
                                    checklistDone[item.key] && styles.checkItemDone
                                ]}
                                onPress={() => setChecklistDone(prev => ({
                                    ...prev,
                                    [item.key]: !prev[item.key]
                                }))}
                            >
                                <View style={[
                                    styles.checkbox,
                                    checklistDone[item.key] && styles.checkboxDone
                                ]}>
                                    {checklistDone[item.key] && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.checkText}>{item.text}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.nextBtn, !allChecked && styles.nextBtnDisabled]}
                            onPress={allChecked ? handleComplete : null}
                            disabled={!allChecked}
                        >
                            <Text style={styles.nextBtnText}>
                                {allChecked ? 'I UNDERSTAND — CONTINUE' : `CHECK ALL ${Object.values(checklistDone).filter(Boolean).length}/4 TO CONTINUE`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

function StatBox({ label, value, color }) {
    return (
        <View style={[styles.statBox, { borderColor: color }]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    scroll: {
        paddingBottom: 40,
    },
    header: {
        backgroundColor: '#7F1D1D', // Dark red warning header
        padding: Spacing.xl,
        alignItems: 'center',
        paddingTop: Spacing.xl,
    },
    warningIcon: {
        fontSize: 48,
        marginBottom: Spacing.md,
    },
    title: {
        fontFamily: Typography.sans.family,
        fontSize: 22,
        fontWeight: Typography.sans.weights.bold,
        color: '#FECACA',
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        color: '#FCA5A5',
        textAlign: 'center',
        lineHeight: 22,
    },
    card: {
        margin: Spacing.lg,
        backgroundColor: Colors.background.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.xl,
    },
    cardTitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.heading,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.sail.navy,
        marginBottom: Spacing.md,
        letterSpacing: 1,
    },
    cardText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.secondary,
        lineHeight: 22,
        marginBottom: Spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    statBox: {
        flex: 1,
        borderWidth: 2,
        borderRadius: 8,
        padding: Spacing.md,
        alignItems: 'center',
    },
    statValue: {
        fontFamily: Typography.mono.family,
        fontSize: 28,
        fontWeight: '700',
    },
    statLabel: {
        fontFamily: Typography.sans.family,
        fontSize: 10,
        color: Colors.text.tertiary,
        fontWeight: '700',
        letterSpacing: 0.5,
        textAlign: 'center',
        marginTop: 4,
    },
    videoBox: {
        height: 180,
        backgroundColor: '#0F172A',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        alignItems: 'center',
    },
    playIcon: {
        fontSize: 48,
        color: Colors.sail.blue,
    },
    playLabel: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.caption,
        color: Colors.text.tertiary,
        marginTop: Spacing.sm,
        letterSpacing: 1,
    },
    videoPlaying: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: Spacing.xl,
    },
    countdownNum: {
        fontFamily: Typography.mono.family,
        fontSize: 64,
        color: Colors.status.safe,
        lineHeight: 72,
    },
    countdownLabel: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.caption,
        color: Colors.text.tertiary,
        marginBottom: Spacing.md,
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: '#1E293B',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.status.safe,
        borderRadius: 3,
    },
    videoPoints: {
        gap: Spacing.sm,
    },
    videoPoint: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.secondary,
        lineHeight: 22,
        paddingVertical: 4,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.sm,
        gap: Spacing.md,
        backgroundColor: Colors.background.primary,
    },
    checkItemDone: {
        backgroundColor: `${Colors.status.safe}10`,
        borderColor: Colors.status.safe,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    checkboxDone: {
        backgroundColor: Colors.status.safe,
        borderColor: Colors.status.safe,
    },
    checkmark: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    checkText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.primary,
        flex: 1,
        lineHeight: 22,
    },
    nextBtn: {
        marginTop: Spacing.lg,
        backgroundColor: Colors.sail.blue,
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    nextBtnDisabled: {
        opacity: 0.4,
    },
    nextBtnText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        fontWeight: Typography.sans.weights.bold,
        color: 'white',
        letterSpacing: 1,
    },
});