import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Platform,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Line, Polygon, SvgUri } from 'react-native-svg';
import { useKeepAwake } from 'expo-keep-awake';
import { Colors, Typography, Spacing } from '../theme';
import { useTripStore } from '../store/tripStore';
import { Speedometer } from '../components/Speedometer';
import { VoiceCommandOverlay } from '../components/VoiceCommandOverlay';
import apiClient from '../api/client';

// SVG Icons
const SailLogo = () => (
    <View style={{ width: 28, height: 28, backgroundColor: '#FFFFFF', borderRadius: 6, padding: 2, alignItems: 'center', justifyContent: 'center' }}>
        <SvgUri
            width="100%"
            height="100%"
            uri="https://upload.wikimedia.org/wikipedia/en/0/00/Steel_Authority_of_India_logo.svg"
        />
    </View>
);

const ShieldXIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <Path d="M15 9l-6 6M9 9l6 6" />
    </Svg>
);

const MicIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
        <Path d="M19 10v1a7 7 0 01-14 0v-1M12 19v4M8 23h8" />
    </Svg>
);

const GradCapIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <Path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </Svg>
);

const WarningShieldIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <Path d="M12 9v4" />
        <Circle cx="12" cy="16" r="0.5" fill="#EF4444" />
    </Svg>
);

const DashboardTabIcon = ({ active }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#A0AEC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="3" width="7" height="9" />
        <Rect x="14" y="3" width="7" height="5" />
        <Rect x="14" y="12" width="7" height="9" />
        <Rect x="3" y="16" width="7" height="5" />
    </Svg>
);

const MapTabIcon = ({ active }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#A0AEC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <Line x1="9" y1="3" x2="9" y2="18" />
        <Line x1="15" y1="6" x2="15" y2="21" />
    </Svg>
);

const AlertsTabIcon = ({ active }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#A0AEC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <Line x1="12" y1="9" x2="12" y2="13" />
        <Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
);

const TrainingTabIcon = ({ active }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#A0AEC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <Path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </Svg>
);

export const ActiveTripScreen = ({ navigation }) => {
    useKeepAwake();

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
        loadType,
    } = useTripStore();

    const [tripStarted, setTripStarted] = useState(false);
    const [tripDuration, setTripDuration] = useState(0);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'map' | 'alerts'
    const [endedTripSummary, setEndedTripSummary] = useState(null);
    const [ending, setEnding] = useState(false);

    useEffect(() => {
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
        const success = await startTrip();
        if (success) {
            setTripStarted(true);
            setActiveTab('dashboard');
        } else {
            Alert.alert('Error', 'Failed to start trip. Please try again.');
        }
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
                        setEnding(true);
                        const result = await endTrip();
                        setEnding(false);
                        if (result) {
                            setTripStarted(false);
                            setEndedTripSummary(result);
                            // Switch to Alerts summary page
                            setActiveTab('alerts');
                        } else {
                            Alert.alert('Error', 'Could not end trip session.');
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

    const handleReportIncident = () => {
        Alert.prompt(
            '🎤 Incident Report',
            'Describe the road hazard or incident:',
            async (text) => {
                if (text && text.trim()) {
                    const { currentVehicle, currentLocation } = useTripStore.getState();
                    try {
                        await apiClient.post('/api/incidents/', {
                            vehicle_id: currentVehicle?.id,
                            trip_id: currentTrip?.id,
                            transcript: text.trim(),
                            lat: currentLocation?.lat || 0,
                            lng: currentLocation?.lng || 0,
                        });
                        Alert.alert('✅ Incident Logged', 'Supervisor has been notified.');
                    } catch (err) {
                        Alert.alert('Error', 'Could not log incident. Try again.');
                    }
                }
            },
            'plain-text'
        );
    };

    // Render helper for pre-start screen
    if (!tripStarted && !endedTripSummary) {
        return (
            <SafeAreaView style={styles.container} edges={[]}>
                <StatusBar barStyle="light-content" backgroundColor="#07162C" />
                
                {/* Topbar */}
                <View style={styles.topbar}>
                    <View style={styles.logoRow}>
                        <SailLogo />
                        <Text style={styles.logoText}>SpeedWatch</Text>
                    </View>
                    <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
                        <Text style={styles.sosText}>SOS</Text>
                    </TouchableOpacity>
                </View>

                <LinearGradient
                    colors={['#07162C', '#0A2244']}
                    style={styles.gradient}
                >
                    <View style={styles.preStartContainer}>
                        <Text style={styles.preStartTitle}>READY TO START</Text>
                        <Text style={styles.preStartSubtitle}>
                            Speed monitoring will begin when you start your trip.
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
                                    {loadType.toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.preStartMetric}>
                                <Text style={styles.preStartMetricLabel}>VIOLATIONS TODAY</Text>
                                <Text style={[styles.preStartMetricValue, violationsToday >= 5 && { color: '#EF4444' }]}>
                                    {violationsToday} / 5
                                </Text>
                            </View>
                        </View>

                        {violationsToday >= 5 && (
                            <View style={styles.warningBox}>
                                <View style={styles.warningHeader}>
                                    <WarningShieldIcon />
                                    <Text style={styles.warningTitle}>TRAINING REQUIRED</Text>
                                </View>
                                <Text style={styles.warningText}>
                                    You have accumulated 5 violations today. Please complete safety training before starting another driving shift.
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.startTripButton, violationsToday >= 5 && styles.startTripButtonDisabled]}
                            onPress={handleStartTrip}
                            disabled={violationsToday >= 5}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.startTripButtonText}>START SHIFT</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <StatusBar barStyle="light-content" backgroundColor="#07162C" />
            <VoiceCommandOverlay
                message={supervisorMessage}
                onAcknowledge={() => setSupervisorMessage(null)}
            />

            {/* Top bar (visible across all active states) */}
            <View style={styles.topbar}>
                <View style={styles.logoRow}>
                    <SailLogo />
                    <Text style={styles.logoText}>SpeedWatch</Text>
                </View>
                <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
                    <Text style={styles.sosText}>SOS</Text>
                </TouchableOpacity>
            </View>

            <LinearGradient
                colors={['#07162C', '#0A2244']}
                style={styles.gradient}
            >
                {/* ── Tab Views ── */}
                <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                    
                    {/* Dashboard Tab View */}
                    {activeTab === 'dashboard' && (
                        <View style={styles.dashboardContainer}>
                            
                            {/* Trip duration status header */}
                            <View style={styles.durationHeader}>
                                <View style={styles.durationBlock}>
                                    <Text style={styles.durationLabel}>TRIP DURATION</Text>
                                    <Text style={styles.durationValue}>{formatDuration(tripDuration)}</Text>
                                </View>
                                <View style={styles.durationDivider} />
                                <View style={styles.durationBlock}>
                                    <Text style={styles.durationLabel}>STATUS</Text>
                                    <Text style={[styles.statusChip, {
                                        color: status === 'violation' ? '#EF4444' : status === 'warning' ? '#F5A623' : '#16C974',
                                    }]}>
                                        {status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            {/* Speedometer Gauge Component */}
                            <View style={styles.speedometerWrapper}>
                                <Speedometer speed={currentSpeed} limit={currentLimit} status={status} loadType={loadType} />
                            </View>

                            {/* Violations & Penalty Metric Cards */}
                            <View style={styles.metricsRow}>
                                <View style={[styles.metricCard, { borderLeftColor: '#EF4444' }]}>
                                    <Text style={styles.metricCardLabel}>VIOLATIONS</Text>
                                    <Text style={[styles.metricCardValue, { color: '#EF4444' }]}>
                                        {tripViolations}
                                    </Text>
                                    <Text style={styles.metricCardSub}>Today</Text>
                                </View>
                                <View style={[styles.metricCard, { borderLeftColor: '#60A5FA' }]}>
                                    <Text style={styles.metricCardLabel}>PENALTY</Text>
                                    <Text style={styles.metricCardValue}>
                                        ₹{tripPenalty.toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={styles.metricCardSub}>Enforced</Text>
                                </View>
                            </View>

                            {/* Training Mandate Banner (Conditional Warning) */}
                            {violationsToday >= 4 && (
                                <View style={styles.trainingMandateCard}>
                                    <GradCapIcon />
                                    <View style={styles.trainingTextContainer}>
                                        <Text style={styles.trainingMandateTitle}>Training Mandate</Text>
                                        <Text style={styles.trainingMandateDesc}>
                                            You are approaching/have exceeded violation limits. Mandatory safety training lockout warning active.
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Actions Buttons */}
                            <View style={styles.actionsContainer}>
                                <TouchableOpacity style={styles.incidentBtn} onPress={handleReportIncident} activeOpacity={0.85}>
                                    <MicIcon />
                                    <Text style={styles.incidentBtnText}>REPORT INCIDENT</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.endBtn} onPress={handleEndTrip} disabled={ending} activeOpacity={0.85}>
                                    {ending ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <>
                                            <ShieldXIcon />
                                            <Text style={styles.endBtnText}>END TRIP</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Live Map Tab View */}
                    {activeTab === 'map' && (
                        <View style={styles.mapContainer}>
                            <Text style={styles.mapTitle}>LIVE TRACKING</Text>
                            <Text style={styles.mapSubtitle}>Real-time geofence coordinates and tracking active</Text>
                            
                            {/* Stylized Svg mockup map */}
                            <View style={styles.mockMapFrame}>
                                <Svg width="100%" height="280" viewBox="0 0 320 280">
                                    {/* Map Grid Background */}
                                    <Rect width="320" height="280" fill="#030A16" />
                                    <Line x1="40" y1="0" x2="40" y2="280" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                    <Line x1="120" y1="0" x2="120" y2="280" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                    <Line x1="200" y1="0" x2="200" y2="280" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                    <Line x1="280" y1="0" x2="280" y2="280" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                    <Line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                    <Line x1="0" y1="140" x2="320" y2="140" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                    <Line x1="0" y1="220" x2="320" y2="220" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                                    {/* Geofence Polygons */}
                                    {/* Workshop Area */}
                                    <Polygon points="20,50 110,30 130,90 40,110" fill="rgba(59, 130, 246, 0.15)" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3,3" />
                                    {/* Coal Yard */}
                                    <Polygon points="160,140 290,120 310,190 180,210" fill="rgba(245, 158, 11, 0.15)" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,3" />

                                    {/* Road outlines */}
                                    <Path d="M0,130 C120,130 200,90 320,90" fill="none" stroke="rgba(26, 46, 90, 0.6)" strokeWidth="14" />
                                    <Path d="M0,130 C120,130 200,90 320,90" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="5,5" />
                                    <Path d="M150,0 L150,280" fill="none" stroke="rgba(26, 46, 90, 0.6)" strokeWidth="10" />

                                    {/* Vehicle Pointer (Mocking GPS marker moving on path) */}
                                    <Circle cx="160" cy="115" r="14" fill="#16C974" opacity="0.4" />
                                    <Circle cx="160" cy="115" r="7" fill="#FFFFFF" />
                                    <Path d="M155,108 L160,98 L165,108 L160,105 Z" fill="#16C974" />
                                </Svg>
                                
                                <View style={styles.mapOverlayLabel}>
                                    <Text style={styles.mapOverlayText}>SAIL Ranchi RDCIS · GPS Live Stream</Text>
                                </View>
                            </View>

                            <View style={styles.mapInfoCard}>
                                <Text style={styles.mapInfoTitle}>ACTIVE ZONE</Text>
                                <Text style={styles.mapInfoValue}>
                                    {currentZone ? currentZone.name.toUpperCase() : 'MAIN ROADWAY'}
                                </Text>
                                <Text style={styles.mapInfoSubtitle}>Speed limits enforced automatically</Text>
                            </View>
                        </View>
                    )}

                    {/* Alerts/Summary Tab View (Pixel-perfect to input_file_4.png) */}
                    {activeTab === 'alerts' && (
                        <View style={styles.alertsContainer}>
                            <View style={styles.sessionHeaderRow}>
                                <View style={styles.redDot} />
                                <Text style={styles.sessionEndedText}>TRIP SESSION ENDED</Text>
                            </View>

                            <Text style={styles.alertsTitle}>Industrial Safety Summary</Text>
                            <Text style={styles.alertsSubtitle}>
                                Summary for Trip #{currentTrip?.id?.slice(0, 8) || '8842-Alpha'}. Recorded by Fleet Safety Monitoring System.
                            </Text>

                            {/* Accrued Penalty Card */}
                            <View style={styles.accruedCard}>
                                <Text style={styles.cardSectionLabel}>TOTAL PENALTY ACCRUED</Text>
                                <Text style={styles.accruedValueText}>
                                    ₹ {(endedTripSummary?.total_penalty || tripPenalty).toLocaleString('en-IN')}
                                </Text>

                                {/* Progress Bar */}
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBg}>
                                        <View style={[
                                            styles.progressFill,
                                            { width: `${Math.min(((endedTripSummary?.total_penalty || tripPenalty) / 15000) * 100, 100)}%` }
                                        ]} />
                                    </View>
                                    <Text style={styles.limitLabelText}>Limit: ₹15,000</Text>
                                </View>
                            </View>

                            {/* Violations Recorded Card */}
                            <View style={styles.whiteCard}>
                                <Text style={styles.whiteCardLabel}>VIOLATIONS RECORDED</Text>
                                <Text style={styles.whiteCardValueText}>
                                    {endedTripSummary?.violation_count ?? tripViolations}
                                </Text>
                                <View style={styles.actionRequiredRow}>
                                    <WarningShieldIcon />
                                    <Text style={styles.actionRequiredText}>Action Required</Text>
                                </View>
                            </View>

                            {/* Safety Status Card */}
                            <View style={styles.whiteCard}>
                                <View style={styles.statusHeaderRow}>
                                    <Text style={styles.whiteCardLabel}>SAFETY STATUS</Text>
                                    <View style={styles.alertBadge}>
                                        <Text style={styles.alertBadgeText}>ALERT</Text>
                                    </View>
                                </View>
                                <View style={styles.statusRow}>
                                    <View style={styles.redShieldCircle}>
                                        <WarningShieldIcon />
                                    </View>
                                    <View style={styles.statusTextCol}>
                                        <Text style={styles.statusBoldText}>Unsafe</Text>
                                        <Text style={styles.statusMutedText}>Risk Level: High</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Exit Session Button */}
                            <TouchableOpacity
                                style={styles.exitSessionBtn}
                                onPress={() => {
                                    setEndedTripSummary(null);
                                    navigation.replace('VehicleSelection');
                                }}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.exitSessionBtnText}>CLOSE REPORT</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>

                {/* ── Bottom Navigation Tab Bar (styled precisely matching images) ── */}
                <View style={styles.tabbar}>
                    
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' ? (
                        <View style={styles.activeTabPill}>
                            <DashboardTabIcon active={true} />
                            <Text style={styles.activeTabText}>Dashboard</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.inactiveTab} onPress={() => setActiveTab('dashboard')}>
                            <DashboardTabIcon active={false} />
                            <Text style={styles.inactiveTabText}>Dashboard</Text>
                        </TouchableOpacity>
                    )}

                    {/* Live Map Tab */}
                    {activeTab === 'map' ? (
                        <View style={styles.activeTabPill}>
                            <MapTabIcon active={true} />
                            <Text style={styles.activeTabText}>Live Map</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.inactiveTab} onPress={() => setActiveTab('map')}>
                            <MapTabIcon active={false} />
                            <Text style={styles.inactiveTabText}>Live Map</Text>
                        </TouchableOpacity>
                    )}

                    {/* Alerts Tab */}
                    {activeTab === 'alerts' ? (
                        <View style={styles.activeTabPill}>
                            <AlertsTabIcon active={true} />
                            <Text style={styles.activeTabText}>Alerts</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.inactiveTab} onPress={() => setActiveTab('alerts')}>
                            <AlertsTabIcon active={false} />
                            <Text style={styles.inactiveTabText}>Alerts</Text>
                        </TouchableOpacity>
                    )}

                    {/* Training Tab (Routes back to training if needed, or demonstrates lockouts) */}
                    <TouchableOpacity
                        style={styles.inactiveTab}
                        onPress={() => {
                            if (violationsToday >= 5) {
                                navigation.replace('Training');
                            } else {
                                Alert.alert('Training Center', 'No training mandate active. Clean record.');
                            }
                        }}
                    >
                        <TrainingTabIcon active={false} />
                        <Text style={styles.inactiveTabText}>Training</Text>
                    </TouchableOpacity>
                </View>

            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#07162C',
    },
    topbar: {
        height: 60,
        backgroundColor: '#07162C',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1A2E5A',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    sosBtn: {
        backgroundColor: '#CC0000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    sosText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 11,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    
    // Bottom Tab Bar
    tabbar: {
        height: 68,
        backgroundColor: '#07162C',
        borderTopWidth: 1.5,
        borderTopColor: '#1A2E5A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        paddingBottom: Platform.OS === 'ios' ? 14 : 0,
    },
    activeTabPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A1931',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    activeTabText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    inactiveTab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        minWidth: 70,
    },
    inactiveTabText: {
        color: '#A0AEC0',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
    },

    // Duration Block Header
    durationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 28, 54, 0.7)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#1A2E5A',
        marginBottom: 24,
    },
    durationBlock: { flex: 1, alignItems: 'center' },
    durationDivider: { width: 1.5, height: 40, backgroundColor: '#1A2E5A' },
    durationLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#60A5FA',
        letterSpacing: 1,
        marginBottom: 4,
    },
    durationValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    statusChip: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // Speedometer Layout
    speedometerWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        marginBottom: 30,
    },

    // Metrics Row Cards
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    metricCard: {
        flex: 1,
        backgroundColor: 'rgba(16, 28, 54, 0.7)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#1A2E5A',
        borderLeftWidth: 4,
        padding: 14,
    },
    metricCardLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#A0AEC0',
        letterSpacing: 0.5,
    },
    metricCardValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginVertical: 4,
    },
    metricCardSub: {
        fontSize: 9,
        color: '#A0AEC0',
        opacity: 0.6,
    },

    // Training Mandate
    trainingMandateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
        padding: 16,
        gap: 12,
        marginBottom: 24,
    },
    trainingTextContainer: {
        flex: 1,
    },
    trainingMandateTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    trainingMandateDesc: {
        fontSize: 11,
        color: '#A0AEC0',
        lineHeight: 15,
        marginTop: 2,
    },

    // Dashboard Buttons
    actionsContainer: {
        flexDirection: 'column',
        gap: 12,
        marginBottom: 20,
    },
    incidentBtn: {
        height: 52,
        backgroundColor: 'rgba(16, 28, 54, 0.7)',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#1A2E5A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    incidentBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    endBtn: {
        height: 52,
        backgroundColor: '#CC0000',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    endBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // Pre-start Styles
    preStartContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    preStartTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    preStartSubtitle: {
        fontSize: 13,
        color: '#A0AEC0',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
    preStartMetrics: {
        marginVertical: 32,
        gap: 12,
    },
    preStartMetric: {
        backgroundColor: 'rgba(16, 28, 54, 0.7)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#1A2E5A',
        padding: 16,
    },
    preStartMetricLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#60A5FA',
        letterSpacing: 0.5,
    },
    preStartMetricValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 4,
    },
    warningBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
        padding: 16,
        marginBottom: 20,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    warningTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    warningText: {
        fontSize: 11,
        color: '#A0AEC0',
        lineHeight: 15,
    },
    startTripButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startTripButtonDisabled: {
        opacity: 0.4,
    },
    startTripButtonText: {
        color: '#07162C',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // Mock Map Tab
    mapContainer: {
        paddingTop: 10,
    },
    mapTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    mapSubtitle: {
        fontSize: 12,
        color: '#A0AEC0',
        marginTop: 4,
        marginBottom: 20,
    },
    mockMapFrame: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#1A2E5A',
        position: 'relative',
    },
    mapOverlayLabel: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(3, 10, 22, 0.85)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    mapOverlayText: {
        color: '#A0AEC0',
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    mapInfoCard: {
        backgroundColor: 'rgba(16, 28, 54, 0.7)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#1A2E5A',
        padding: 16,
        marginTop: 16,
    },
    mapInfoTitle: {
        fontSize: 9,
        fontWeight: '800',
        color: '#60A5FA',
        letterSpacing: 0.5,
    },
    mapInfoValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginVertical: 4,
    },
    mapInfoSubtitle: {
        fontSize: 10,
        color: '#A0AEC0',
        opacity: 0.7,
    },

    // Alerts Tab (Trip ended summary layout matching input_file_4.png)
    alertsContainer: {
        paddingTop: 10,
    },
    sessionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    redDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    sessionEndedText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#EF4444',
        letterSpacing: 0.5,
    },
    alertsTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    alertsSubtitle: {
        fontSize: 12,
        color: '#A0AEC0',
        marginTop: 4,
        lineHeight: 16,
        marginBottom: 20,
    },
    accruedCard: {
        backgroundColor: 'rgba(16, 28, 54, 0.7)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#1A2E5A',
        padding: 20,
        marginBottom: 16,
    },
    cardSectionLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#A0AEC0',
        letterSpacing: 0.5,
    },
    accruedValueText: {
        fontSize: 34,
        fontWeight: '800',
        color: '#EF4444',
        marginVertical: 10,
    },
    progressContainer: {
        marginTop: 10,
    },
    progressBg: {
        height: 6,
        backgroundColor: '#1E2D4A',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#EF4444',
        borderRadius: 3,
    },
    limitLabelText: {
        fontSize: 10,
        color: '#A0AEC0',
        textAlign: 'right',
        marginTop: 6,
    },
    whiteCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    whiteCardLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#718096',
        letterSpacing: 0.5,
    },
    whiteCardValueText: {
        fontSize: 38,
        fontWeight: '800',
        color: '#07162C',
        marginVertical: 4,
    },
    actionRequiredRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    actionRequiredText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#EF4444',
    },
    statusHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    alertBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    alertBadgeText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#EF4444',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    redShieldCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusTextCol: {
        flexDirection: 'column',
    },
    statusBoldText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#07162C',
    },
    statusMutedText: {
        fontSize: 11,
        color: '#718096',
        marginTop: 2,
    },
    exitSessionBtn: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    exitSessionBtnText: {
        color: '#07162C',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});