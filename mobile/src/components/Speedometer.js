import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../theme';

export const Speedometer = ({ speed = 0, limit = 50, status = 'safe', loadType = 'empty' }) => {
    const size = 240;
    const center = size / 2;
    const radius = 96;
    const strokeWidth = 10;

    // 270-degree arc parameters
    const startAngle = -225; // bottom-left
    const endAngle = 45;    // bottom-right
    const maxSpeed = 120;

    const speedRatio = Math.min(speed / maxSpeed, 1);
    const speedAngle = startAngle + (speedRatio * 270);

    const polarToCartesian = (angle) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: center + radius * Math.cos(rad),
            y: center + radius * Math.sin(rad),
        };
    };

    const createArc = (start, end) => {
        const startPoint = polarToCartesian(start);
        const endPoint = polarToCartesian(end);
        const largeArc = end - start > 180 ? 1 : 0;
        return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
    };

    // Calculate pointer position
    const pointerPos = polarToCartesian(speedAngle);

    // Get color for progress arc based on status
    const arcColor = status === 'violation' ? '#EF4444' : status === 'warning' ? '#F5A623' : '#3B82F6';

    const getLoadTypeLabel = () => {
        if (loadType === 'hazardous') return 'Hazardous Cargo';
        if (loadType === 'full') return 'Full Cargo';
        return 'Standard Cargo';
    };

    return (
        <View style={styles.container}>
            {/* Speedometer Svg Dial */}
            <View style={styles.svgWrapper}>
                <Svg width={size} height={size}>
                    {/* Background Track */}
                    <Path
                        d={createArc(startAngle, endAngle)}
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                    />

                    {/* Progress Arc */}
                    {speed > 0 && (
                        <Path
                            d={createArc(startAngle, speedAngle)}
                            stroke={arcColor}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeLinecap="round"
                        />
                    )}

                    {/* White Pointer Circle */}
                    <Circle
                        cx={pointerPos.x}
                        cy={pointerPos.y}
                        r="8"
                        fill="#FFFFFF"
                        stroke={arcColor}
                        strokeWidth="2"
                    />
                </Svg>

                {/* Center digital speed readout */}
                <View style={styles.centerReadout}>
                    <Text style={styles.speedText}>{Math.round(speed)}</Text>
                    <Text style={styles.unitText}>— KM/H —</Text>
                </View>
            </View>

            {/* Current Limit floating panel */}
            <View style={styles.limitCard}>
                <View style={styles.limitSign}>
                    <View style={styles.limitCircle}>
                        <Text style={styles.limitSignText}>{limit}</Text>
                    </View>
                </View>
                <View style={styles.limitTextContainer}>
                    <Text style={styles.limitLabel}>CURRENT LIMIT</Text>
                    <Text style={styles.limitValue}>{getLoadTypeLabel()}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    svgWrapper: {
        position: 'relative',
        width: 240,
        height: 240,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerReadout: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    speedText: {
        fontSize: 76,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 84,
    },
    unitText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#A0AEC0',
        letterSpacing: 1.5,
        marginTop: -2,
    },
    limitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#101C36',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#1A2E5A',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: -30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
        gap: 12,
        minWidth: 190,
    },
    limitSign: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    limitCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2.5,
        borderColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    limitSignText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#07162C',
    },
    limitTextContainer: {
        flexDirection: 'column',
    },
    limitLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#60A5FA',
        letterSpacing: 0.5,
    },
    limitValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 2,
    },
});