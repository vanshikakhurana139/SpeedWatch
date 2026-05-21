import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../theme';

export const Speedometer = ({ speed, limit, status }) => {
    // Arc parameters
    const size = 280;
    const center = size / 2;
    const radius = 110;
    const strokeWidth = 20;

    // Speed arc (0-120 km/h range, shown as 270-degree arc)
    const startAngle = -225; // Start at bottom-left
    const endAngle = 45; // End at bottom-right
    const maxSpeed = 120;

    // Calculate current speed angle
    const speedRatio = Math.min(speed / maxSpeed, 1);
    const speedAngle = startAngle + (speedRatio * 270);

    // Convert angle to path
    const polarToCartesian = (angle) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: center + radius * Math.cos(rad),
            y: center + radius * Math.sin(rad),
        };
    };

    const createArc = (start, end, color) => {
        const startPoint = polarToCartesian(start);
        const endPoint = polarToCartesian(end);
        const largeArc = end - start > 180 ? 1 : 0;

        return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
    };

    // Color zones on the arc
    const safeZoneEnd = (40 / maxSpeed) * 270 + startAngle;
    const warningZoneEnd = (limit / maxSpeed) * 270 + startAngle;

    return (
        <View style={styles.container}>
            <Svg width={size} height={size}>
                {/* Background arc (full range in dark gray) */}
                <Path
                    d={createArc(startAngle, endAngle, Colors.border)}
                    stroke={Colors.border}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Safe zone (green: 0-40) */}
                <Path
                    d={createArc(startAngle, safeZoneEnd, Colors.status.safe)}
                    stroke={Colors.status.safe}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.3}
                />

                {/* Warning zone (amber: 40-limit) */}
                <Path
                    d={createArc(safeZoneEnd, warningZoneEnd, Colors.status.warning)}
                    stroke={Colors.status.warning}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.3}
                />

                {/* Violation zone (red: limit-120) */}
                <Path
                    d={createArc(warningZoneEnd, endAngle, Colors.status.violation)}
                    stroke={Colors.status.violation}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.3}
                />

                {/* Current speed arc (highlighted) */}
                {speed > 0 && (
                    <Path
                        d={createArc(startAngle, speedAngle,
                            status === 'violation' ? Colors.status.violation :
                                status === 'warning' ? Colors.status.warning :
                                    Colors.status.safe
                        )}
                        stroke={
                            status === 'violation' ? Colors.status.violation :
                                status === 'warning' ? Colors.status.warning :
                                    Colors.status.safe
                        }
                        strokeWidth={strokeWidth + 4}
                        fill="none"
                        strokeLinecap="round"
                    />
                )}

                {/* Tick marks every 20 km/h */}
                {[0, 20, 40, 60, 80, 100, 120].map((tickSpeed) => {
                    const angle = startAngle + (tickSpeed / maxSpeed) * 270;
                    const outerPoint = polarToCartesian(angle);
                    const innerRadius = radius - 15;
                    const innerAngleRad = (angle * Math.PI) / 180;
                    const innerPoint = {
                        x: center + innerRadius * Math.cos(innerAngleRad),
                        y: center + innerRadius * Math.sin(innerAngleRad),
                    };

                    return (
                        <Line
                            key={tickSpeed}
                            x1={innerPoint.x}
                            y1={innerPoint.y}
                            x2={outerPoint.x}
                            y2={outerPoint.y}
                            stroke={Colors.text.tertiary}
                            strokeWidth={2}
                        />
                    );
                })}

                {/* Speed labels */}
                {[0, 40, 80, 120].map((labelSpeed) => {
                    const angle = startAngle + (labelSpeed / maxSpeed) * 270;
                    const labelRadius = radius - 35;
                    const angleRad = (angle * Math.PI) / 180;
                    const labelPoint = {
                        x: center + labelRadius * Math.cos(angleRad),
                        y: center + labelRadius * Math.sin(angleRad),
                    };

                    return (
                        <SvgText
                            key={`label-${labelSpeed}`}
                            x={labelPoint.x}
                            y={labelPoint.y}
                            fill={Colors.text.tertiary}
                            fontSize="12"
                            fontFamily="monospace"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {labelSpeed}
                        </SvgText>
                    );
                })}
            </Svg>

            {/* Digital speed readout (center) */}
            <View style={styles.digitalReadout}>
                <Text style={styles.speedText}>{Math.round(speed)}</Text>
                <Text style={styles.unitText}>km/h</Text>
            </View>

            {/* Speed limit indicator */}
            <View style={styles.limitIndicator}>
                <Text style={styles.limitLabel}>LIMIT</Text>
                <Text style={styles.limitValue}>{limit}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    digitalReadout: {
        position: 'absolute',
        top: '45%',
        alignItems: 'center',
    },
    speedText: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.mono.sizes.huge,
        color: Colors.text.primary,
        fontWeight: '700',
        letterSpacing: -2,
    },
    unitText: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.mono.sizes.tiny,
        color: Colors.text.tertiary,
        marginTop: -8,
    },
    limitIndicator: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    limitLabel: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
        fontWeight: '600',
        letterSpacing: 1,
    },
    limitValue: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.mono.sizes.medium,
        color: Colors.text.secondary,
        fontWeight: '700',
    },
});