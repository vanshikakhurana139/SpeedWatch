import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    StatusBar,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Polygon } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../theme';
import { vehiclesApi } from '../api/vehicles';
import { geofencesApi } from '../api/geofences';
import { cacheGeofences } from '../services/database';
import { useTripStore } from '../store/tripStore';

// Custom Icons
const SailLogo = () => (
    <Svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        <Rect width="40" height="40" rx="6" fill="#FFFFFF" />
        <Path d="M20 6 L34 20 L20 34 L6 20 Z" fill="none" stroke="#07162C" strokeWidth="2.5" />
        <Path d="M20 12 L28 20 L20 28 L12 20 Z" fill="#07162C" />
    </Svg>
);

const TruckIcon = ({ color = '#A0AEC0' }) => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
        <Polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <Circle cx="5.5" cy="18.5" r="2.5" />
        <Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
);

const CheckSealIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16C974" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <Path d="M9 11l2 2 4-4" />
    </Svg>
);

const EmptyIcon = ({ color }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="3" width="18" height="18" rx="2" />
        <Path d="M3 9h18" />
    </Svg>
);

const PartialIcon = ({ color }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="3" width="18" height="18" rx="2" />
        <Path d="M3 9h18" />
        <Rect x="3" y="15" width="18" height="6" fill={color} opacity="0.3" />
    </Svg>
);

const FullIcon = ({ color }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="3" width="18" height="18" rx="2" />
        <Path d="M3 9h18" />
        <Rect x="3" y="9" width="18" height="12" fill={color} opacity="0.4" />
    </Svg>
);

const WarningShieldIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <Path d="M12 9v4" />
        <Circle cx="12" cy="16" r="0.5" fill="#EF4444" />
    </Svg>
);

const RightArrowIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#07162C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
);

export const VehicleSelectionScreen = ({ navigation }) => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedLoadType, setSelectedLoadType] = useState('empty');

    const { setVehicle, setLoadType, setGeofences } = useTripStore();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const vehiclesData = await vehiclesApi.getVehicles();
            setVehicles(vehiclesData);

            const geofencesData = await geofencesApi.getGeofences();
            setGeofences(geofencesData);
            await cacheGeofences(geofencesData);

            // Select first vehicle as default if available
            if (vehiclesData && vehiclesData.length > 0) {
                setSelectedVehicle(vehiclesData[0]);
            }
            setLoading(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to load vehicles. Please try again.');
            setLoading(false);
        }
    };

    const handleStartShift = () => {
        if (!selectedVehicle) {
            Alert.alert('Select Vehicle', 'Please select a vehicle to start shift');
            return;
        }

        setVehicle(selectedVehicle);
        setLoadType(selectedLoadType);

        const { violationsToday } = useTripStore.getState();
        if (violationsToday >= 5) {
            navigation.replace('Training');
        } else {
            navigation.replace('ActiveTrip');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16C974" />
                <Text style={styles.loadingText}>Initializing systems...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <StatusBar barStyle="light-content" backgroundColor="#07162C" />

            {/* Custom Top bar */}
            <View style={styles.topbar}>
                <View style={styles.logoRow}>
                    <SailLogo />
                    <Text style={styles.logoText}>SpeedWatch</Text>
                </View>
                <TouchableOpacity style={styles.sosBtn} onPress={() => Alert.alert('SOS Triggered', 'Emergency service notified.')}>
                    <Text style={styles.sosText}>SOS</Text>
                </TouchableOpacity>
            </View>

            <LinearGradient
                colors={['#07162C', '#0A2244']}
                style={styles.gradient}
            >
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    
                    {/* Screen Title */}
                    <View style={styles.titleSection}>
                        <Text style={styles.screenTitle}>SELECT VEHICLE</Text>
                        <Text style={styles.screenSubtitle}>
                            Initialize your operational shift by verifying assigned equipment and load status.
                        </Text>
                    </View>

                    {/* Assigned Vehicle Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>ASSIGNED VEHICLE</Text>
                        
                        {vehicles.map((item) => {
                            const isSelected = selectedVehicle?.id === item.id;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.vehicleCard,
                                        isSelected && styles.vehicleCardSelected,
                                    ]}
                                    onPress={() => setSelectedVehicle(item)}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={styles.verifiedRow}>
                                            <View style={styles.redDot} />
                                            <Text style={styles.verifiedText}>VERIFIED ASSET</Text>
                                        </View>
                                        {isSelected && <CheckSealIcon />}
                                    </View>

                                    <Text style={styles.vehiclePlate}>{item.license_plate}</Text>

                                    <View style={styles.typeRow}>
                                        <TruckIcon color="#60A5FA" />
                                        <Text style={styles.vehicleType}>
                                            {item.vehicle_type.replace('_', ' ').toUpperCase()}
                                        </Text>
                                    </View>

                                    <Text style={styles.vendorName}>
                                        {item.vendor_name || 'Tata Minerals Transport'} • Fleet ID: MT-902
                                    </Text>

                                    {isSelected && (
                                        <View style={styles.operationalRow}>
                                            <View style={styles.statusBadge}>
                                                <View style={styles.greenDot} />
                                                <Text style={styles.statusText}>OPERATIONAL</Text>
                                            </View>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Load Type Selector */}
                    <View style={styles.section}>
                        <View style={styles.loadHeaderRow}>
                            <Text style={styles.sectionLabel}>LOAD TYPE</Text>
                            <Text style={styles.loadHintText}>
                                {selectedLoadType === 'hazardous'
                                    ? 'Reduced speed limits apply'
                                    : selectedLoadType === 'full'
                                        ? 'Max 40 km/h on all roads'
                                        : 'Standard speed limits apply'}
                            </Text>
                        </View>

                        <View style={styles.loadRow}>
                            {/* Empty Card */}
                            <TouchableOpacity
                                style={[
                                    styles.loadCard,
                                    selectedLoadType === 'empty' && styles.loadCardSelected,
                                ]}
                                onPress={() => setSelectedLoadType('empty')}
                            >
                                <View style={[styles.loadIconContainer, selectedLoadType === 'empty' && styles.loadIconContainerSelected]}>
                                    <EmptyIcon color={selectedLoadType === 'empty' ? '#07162C' : '#FFFFFF'} />
                                </View>
                                <Text style={[styles.loadLabel, selectedLoadType === 'empty' && styles.loadLabelSelected]}>EMPTY</Text>
                            </TouchableOpacity>

                            {/* Partial Card */}
                            <TouchableOpacity
                                style={[
                                    styles.loadCard,
                                    selectedLoadType === 'partial' && styles.loadCardSelected,
                                ]}
                                onPress={() => setSelectedLoadType('partial')}
                            >
                                <View style={[styles.loadIconContainer, selectedLoadType === 'partial' && styles.loadIconContainerSelected]}>
                                    <PartialIcon color={selectedLoadType === 'partial' ? '#07162C' : '#FFFFFF'} />
                                </View>
                                <Text style={[styles.loadLabel, selectedLoadType === 'partial' && styles.loadLabelSelected]}>PARTIAL</Text>
                            </TouchableOpacity>

                            {/* Full Card */}
                            <TouchableOpacity
                                style={[
                                    styles.loadCard,
                                    selectedLoadType === 'full' && styles.loadCardSelected,
                                ]}
                                onPress={() => setSelectedLoadType('full')}
                            >
                                <View style={[styles.loadIconContainer, selectedLoadType === 'full' && styles.loadIconContainerSelected]}>
                                    <FullIcon color={selectedLoadType === 'full' ? '#07162C' : '#FFFFFF'} />
                                </View>
                                <Text style={[styles.loadLabel, selectedLoadType === 'full' && styles.loadLabelSelected]}>FULL LOAD</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Safety Protocol warning box */}
                    <View style={styles.safetyBox}>
                        <View style={styles.safetyHeader}>
                            <WarningShieldIcon />
                            <Text style={styles.safetyTitle}>SAFETY PROTOCOL ACKNOWLEDGED</Text>
                        </View>
                        <Text style={styles.safetyText}>
                            By starting this shift, you confirm the vehicle has passed the daily inspection and you are fit for operational duty under the SAIL Safety Standards 2024.
                        </Text>
                    </View>

                    {/* Start Shift Button */}
                    <TouchableOpacity
                        style={[
                            styles.startBtn,
                            !selectedVehicle && styles.startBtnDisabled,
                        ]}
                        onPress={handleStartShift}
                        disabled={!selectedVehicle}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.startBtnText}>START SHIFT</Text>
                        <RightArrowIcon />
                    </TouchableOpacity>

                    <View style={{ height: 20 }} />
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#07162C',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#07162C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#A0AEC0',
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
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
    scroll: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 30,
    },
    titleSection: {
        marginBottom: 24,
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    screenSubtitle: {
        fontSize: 12,
        color: '#A0AEC0',
        marginTop: 6,
        lineHeight: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#60A5FA',
        letterSpacing: 1,
        marginBottom: 10,
    },
    vehicleCard: {
        backgroundColor: 'rgba(16, 28, 54, 0.7)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#1A2E5A',
        padding: 18,
        marginBottom: 12,
    },
    vehicleCardSelected: {
        borderColor: '#60A5FA',
        backgroundColor: 'rgba(13, 27, 62, 0.9)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    redDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
    },
    verifiedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#A0AEC0',
        letterSpacing: 0.5,
    },
    vehiclePlate: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    typeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    vehicleType: {
        fontSize: 12,
        fontWeight: '700',
        color: '#60A5FA',
    },
    vendorName: {
        fontSize: 11,
        color: '#A0AEC0',
        opacity: 0.8,
    },
    operationalRow: {
        flexDirection: 'row',
        marginTop: 14,
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#16C974',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: 'rgba(22, 201, 116, 0.1)',
    },
    greenDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#16C974',
    },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#16C974',
    },
    loadHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    loadHintText: {
        fontSize: 10,
        color: '#A0AEC0',
        fontStyle: 'italic',
    },
    loadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    loadCard: {
        flex: 1,
        backgroundColor: 'rgba(16, 28, 54, 0.7)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#1A2E5A',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadCardSelected: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    loadIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#0F2547',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    loadIconContainerSelected: {
        backgroundColor: '#F3F4F6',
    },
    loadLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    loadLabelSelected: {
        color: '#07162C',
        fontWeight: '800',
    },
    safetyBox: {
        backgroundColor: '#101C36',
        borderLeftWidth: 4,
        borderLeftColor: '#CC0000',
        borderRadius: 8,
        padding: 16,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#1A2E5A',
    },
    safetyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    safetyTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    safetyText: {
        fontSize: 11,
        color: '#A0AEC0',
        lineHeight: 15,
        opacity: 0.9,
    },
    startBtn: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    startBtnDisabled: {
        opacity: 0.5,
    },
    startBtnText: {
        color: '#07162C',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});