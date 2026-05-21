import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing } from '../theme';
import { useAuthStore } from '../store/authStore';

export const LoginScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Error', 'Please enter phone number and password');
            return;
        }

        const success = await login(phone, password);
        if (success) {
            navigation.replace('VehicleSelection');
        } else if (error) {
            Alert.alert('Login Failed', error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Logo/Title Section */}
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>SPEEDWATCH</Text>
                        <View style={styles.titleUnderline} />
                    </View>
                    <Text style={styles.subtitle}>
                        Industrial Vehicle Speed Enforcement
                    </Text>
                    <Text style={styles.organization}>SAIL - RDCIS Ranchi</Text>
                </View>

                {/* Login Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PHONE NUMBER</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+91 XXXXXXXXXX"
                            placeholderTextColor={Colors.text.tertiary}
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                            autoCapitalize="none"
                            maxLength={15}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PASSWORD</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter password"
                            placeholderTextColor={Colors.text.tertiary}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            isLoading && styles.loginButtonDisabled,
                        ]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={Colors.text.inverse} />
                        ) : (
                            <Text style={styles.loginButtonText}>LOGIN</Text>
                        )}
                    </TouchableOpacity>

                    {/* Development Quick Login */}
                    <View style={styles.devHelper}>
                        <Text style={styles.devHelperTitle}>Development Credentials:</Text>
                        <Text style={styles.devHelperText}>
                            Driver: +919111111001 / driver123
                        </Text>
                        <Text style={styles.devHelperText}>
                            Supervisor: +919000000001 / supervisor123
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        SpeedWatch v1.0 • Phase 2 • SAIL Project
                    </Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxl * 2,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl * 2,
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        fontFamily: Typography.sans.family,
        fontSize: 48,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.primary,
        letterSpacing: 2,
    },
    titleUnderline: {
        width: 120,
        height: 4,
        backgroundColor: Colors.status.safe,
        marginTop: Spacing.sm,
    },
    subtitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.secondary,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    organization: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.sans.sizes.caption,
        color: Colors.text.tertiary,
        marginTop: Spacing.xs,
        letterSpacing: 1,
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        fontWeight: Typography.sans.weights.semibold,
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: Colors.background.secondary,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        fontFamily: Typography.mono.family,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.primary,
    },
    loginButton: {
        backgroundColor: Colors.status.safe,
        borderRadius: 8,
        paddingVertical: Spacing.md + 2,
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.inverse,
        letterSpacing: 1,
    },
    devHelper: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        backgroundColor: Colors.background.secondary,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    devHelperTitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        fontWeight: Typography.sans.weights.semibold,
        color: Colors.text.tertiary,
        marginBottom: Spacing.xs,
    },
    devHelperText: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    footerText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
    },
});