import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

export const StatusBand = ({ status, zone, limit }) => {
    const flashAnim = new Animated.Value(1);

    useEffect(() => {
        if (status === 'violation') {
            // Flash animation for violations
            Animated.loop(
                Animated.sequence([
                    Animated.timing(flashAnim, {
                        toValue: 0.3,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flashAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            flashAnim.setValue(1);
        }
    }, [status]);

    const getStatusConfig = () => {
        switch (status) {
            case 'violation':
                return {
                    text: 'SPEED VIOLATION',
                    color: Colors.status.violation,
                    bgColor: `${Colors.status.violation}20`,
                };
            case 'warning':
                return {
                    text: 'APPROACH LIMIT',
                    color: Colors.status.warning,
                    bgColor: `${Colors.status.warning}20`,
                };
            default:
                return {
                    text: 'SAFE',
                    color: Colors.status.safe,
                    bgColor: `${Colors.status.safe}20`,
                };
        }
    };

    const config = getStatusConfig();

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: config.bgColor,
                    borderLeftColor: config.color,
                    opacity: flashAnim,
                },
            ]}
        >
            <View style={styles.leftSection}>
                <Text style={[styles.statusText, { color: config.color }]}>
                    {config.text}
                </Text>
            </View>

            <View style={styles.rightSection}>
                {zone && (
                    <View style={styles.zoneInfo}>
                        <Text style={styles.zoneLabel}>ZONE</Text>
                        <Text style={styles.zoneName}>{zone.name}</Text>
                    </View>
                )}
                <View style={styles.limitInfo}>
                    <Text style={styles.limitLabel}>LIMIT</Text>
                    <Text style={styles.limitValue}>{limit} km/h</Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderLeftWidth: 4,
        marginVertical: Spacing.md,
    },
    leftSection: {
        flex: 1,
    },
    statusText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.heading,
        fontWeight: Typography.sans.weights.bold,
        letterSpacing: 0.5,
    },
    rightSection: {
        flexDirection: 'row',
        gap: Spacing.lg,
    },
    zoneInfo: {
        alignItems: 'flex-end',
    },
    limitInfo: {
        alignItems: 'flex-end',
    },
    zoneLabel: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
        fontWeight: Typography.sans.weights.semibold,
    },
    zoneName: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.primary,
        fontWeight: Typography.sans.weights.medium,
    },
    limitLabel: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
        fontWeight: Typography.sans.weights.semibold,
    },
    limitValue: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.mono.sizes.medium,
        color: Colors.text.primary,
        fontWeight: '700',
    },
});