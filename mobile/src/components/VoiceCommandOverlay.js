import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Colors, Typography, Spacing } from '../theme';

/**
 * VoiceCommandOverlay
 * 
 * WHY: When a supervisor sends a command from the dashboard,
 * the driver needs to:
 * 1. SEE the message (large text on screen)
 * 2. HEAR the message (Text-to-Speech reads it aloud)
 * 3. ACKNOWLEDGE it (press OK to dismiss)
 * 
 * expo-speech converts text to voice directly on the phone.
 * No internet needed — it uses the phone's built-in TTS engine.
 */
export const VoiceCommandOverlay = ({ message, onAcknowledge }) => {
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        if (!message) return;

        // Fade in the overlay
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Read the message aloud after a 0.5 second delay
        const timer = setTimeout(() => {
            Speech.speak(message, {
                language: 'en-IN',  // Indian English accent
                pitch: 1.0,
                rate: 0.9,  // Slightly slower for clarity
                onDone: () => console.log('TTS complete'),
            });
        }, 500);

        return () => {
            clearTimeout(timer);
            Speech.stop();  // Stop if component unmounts
        };
    }, [message]);

    if (!message) return null;

    const handleAcknowledge = () => {
        Speech.stop();
        onAcknowledge?.();
    };

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <View style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>📢</Text>
                    <Text style={styles.headerTitle}>SUPERVISOR MESSAGE</Text>
                </View>

                {/* Message */}
                <View style={styles.messageBox}>
                    <Text style={styles.messageText}>{message}</Text>
                </View>

                {/* Audio indicator */}
                <View style={styles.audioIndicator}>
                    <Text style={styles.audioText}>🔊 Playing audio...</Text>
                </View>

                {/* Acknowledge button */}
                <TouchableOpacity style={styles.ackButton} onPress={handleAcknowledge}>
                    <Text style={styles.ackButtonText}>✓ ACKNOWLEDGED</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 58, 112, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: Spacing.xl,
    },
    card: {
        backgroundColor: Colors.background.primary,
        borderRadius: 16,
        padding: Spacing.xl,
        width: '100%',
        maxWidth: 400,
        borderWidth: 3,
        borderColor: Colors.sail.blue,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerIcon: { fontSize: 28 },
    headerTitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.subheading,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.sail.navy,
        letterSpacing: 1,
    },
    messageBox: {
        backgroundColor: Colors.sail.lightBlue,
        borderRadius: 8,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: Colors.sail.blue,
    },
    messageText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.heading,
        color: Colors.sail.navy,
        lineHeight: 32,
        fontWeight: Typography.sans.weights.medium,
    },
    audioIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    audioText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.tertiary,
    },
    ackButton: {
        backgroundColor: Colors.sail.blue,
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    ackButtonText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        fontWeight: Typography.sans.weights.bold,
        color: 'white',
        letterSpacing: 1.5,
    },
});