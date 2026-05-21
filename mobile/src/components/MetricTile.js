import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

export const MetricTile = ({ label, value, unit, color = Colors.text.primary }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.valueContainer}>
                <Text style={[styles.value, { color }]}>{value}</Text>
                {unit && <Text style={styles.unit}>{unit}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
        borderRadius: 8,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    label: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
        fontWeight: Typography.sans.weights.semibold,
        marginBottom: Spacing.xs,
        letterSpacing: 0.5,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    value: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.mono.sizes.large,
        fontWeight: '700',
    },
    unit: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.mono.sizes.tiny,
        color: Colors.text.tertiary,
        marginLeft: Spacing.xs,
    },
});