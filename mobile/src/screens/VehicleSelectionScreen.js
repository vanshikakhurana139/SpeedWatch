import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../theme';
import { useTripStore } from '../store/tripStore';
import { vehiclesApi } from '../api/vehicles';
import { geofencesApi } from '../api/geofences';
import { cacheGeofences } from '../services/database';

const LOAD_TYPES = [
    { id: 'empty', label: 'Empty', icon: '◯' },
    { id: 'partial', label: 'Partial Load', icon: '◐' },
    { id: 'full', label: 'Full Load', icon: '●' },
    { id: 'hazardous', label: 'Hazardous', icon: '⚠' },
];

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
            // Fetch vehicles
            const vehiclesData = await vehiclesApi.getVehicles();
            setVehicles(vehiclesData);

            // Fetch and cache geofences
            const geofencesData = await geofencesApi.getGeofences();
            setGeofences(geofencesData);
            await cacheGeofences(geofencesData); // Cache offline

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
        navigation.replace('ActiveTrip');
    };

    const renderVehicleItem = ({ item }) => {
        const isSelected = selectedVehicle?.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.vehicleCard,
                    isSelected && styles.vehicleCardSelected,
                ]}
                onPress={() => setSelectedVehicle(item)}
            >
                <View style={styles.vehicleHeader}>
                    <Text style={styles.vehiclePlate}>{item.license_plate}</Text>
                    {isSelected && (
                        <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>✓</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.vehicleType}>
                    {item.vehicle_type.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.vehicleVendor}>{item.vendor_name}</Text>
            </TouchableOpacity>
        );
    };

    const renderLoadTypeItem = ({ item }) => {
        const isSelected = selectedLoadType === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.loadTypeCard,
                    isSelected && styles.loadTypeCardSelected,
                ]}
                onPress={() => setSelectedLoadType(item.id)}
            >
                <Text style={styles.loadTypeIcon}>{item.icon}</Text>
                <Text
                    style={[
                        styles.loadTypeLabel,
                        isSelected && styles.loadTypeLabelSelected,
                    ]}
                >
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.status.safe} />
                <Text style={styles.loadingText}>Loading vehicles...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>SELECT VEHICLE</Text>
                <Text style={styles.subtitle}>Choose your assigned vehicle and load type</Text>
            </View>

            <View style={styles.content}>
                {/* Vehicles List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ASSIGNED VEHICLES</Text>
                    <FlatList
                        data={vehicles}
                        renderItem={renderVehicleItem}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.vehicleRow}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                {/* Load Type Selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>LOAD TYPE</Text>
                    <FlatList
                        data={LOAD_TYPES}
                        renderItem={renderLoadTypeItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.loadTypeList}
                    />
                    <Text style={styles.loadTypeHint}>
                        {selectedLoadType === 'hazardous'
                            ? '⚠ Reduced speed limits apply'
                            : selectedLoadType === 'full'
                                ? 'Maximum 40 km/h on all roads'
                                : 'Standard speed limits apply'}
                    </Text>
                </View>
            </View>

            {/* Start Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.startButton,
                        !selectedVehicle && styles.startButtonDisabled,
                    ]}
                    onPress={handleStartShift}
                    disabled={!selectedVehicle}
                >
                    <Text style={styles.startButtonText}>START SHIFT</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.secondary,
        marginTop: Spacing.md,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.title,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.primary,
        letterSpacing: 1,
    },
    subtitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.caption,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    section: {
        marginTop: Spacing.lg,
    },
    sectionTitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        fontWeight: Typography.sans.weights.semibold,
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
        marginBottom: Spacing.md,
    },
    vehicleRow: {
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    vehicleCard: {
        flex: 0.48,
        backgroundColor: Colors.background.secondary,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Colors.border,
        padding: Spacing.md,
    },
    vehicleCardSelected: {
        borderColor: Colors.status.safe,
        backgroundColor: `${Colors.status.safe}10`,
    },
    vehicleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    vehiclePlate: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.sans.sizes.body,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.primary,
    },
    selectedBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.status.safe,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedBadgeText: {
        color: Colors.text.inverse,
        fontSize: 14,
        fontWeight: 'bold',
    },
    vehicleType: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
    },
    vehicleVendor: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
    },
    loadTypeList: {
        gap: Spacing.md,
    },
    loadTypeCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Colors.border,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
        minWidth: 100,
    },
    loadTypeCardSelected: {
        borderColor: Colors.accent.blue,
        backgroundColor: `${Colors.accent.blue}10`,
    },
    loadTypeIcon: {
        fontSize: 24,
        marginBottom: Spacing.xs,
    },
    loadTypeLabel: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        fontWeight: Typography.sans.weights.medium,
        color: Colors.text.secondary,
    },
    loadTypeLabelSelected: {
        color: Colors.accent.blue,
        fontWeight: Typography.sans.weights.bold,
    },
    loadTypeHint: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
        marginTop: Spacing.sm,
        fontStyle: 'italic',
    },
    footer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    startButton: {
        backgroundColor: Colors.status.safe,
        borderRadius: 8,
        paddingVertical: Spacing.md + 2,
        alignItems: 'center',
    },
    startButtonDisabled: {
        opacity: 0.4,
    },
    startButtonText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.inverse,
        letterSpacing: 1,
    },
});