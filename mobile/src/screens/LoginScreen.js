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
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '../theme';
import { useAuthStore } from '../store/authStore';

export const LoginScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Required Fields', 'Please enter phone number and password');
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
            {/* SAIL Navy Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    {/* SAIL Logo placeholder - add actual logo */}
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>SAIL</Text>
                    </View>
                </View>
                <Text style={styles.title}>SpeedWatch</Text>
                <Text style={styles.subtitle}>Industrial Vehicle Speed Enforcement</Text>
                <View style={styles.divider} />
                <Text style={styles.organization}>RDCIS Ranchi</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Driver Login</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <View style={styles.inputWrapper}>
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
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.text.tertiary}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                autoCapitalize="none"
                            />
                        </View>
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

                    {/* Development Credentials */}
                    <View style={styles.devHelper}>
                        <Text style={styles.devHelperTitle}>Test Credentials</Text>
                        <View style={styles.devCredential}>
                            <Text style={styles.devLabel}>Driver:</Text>
                            <Text style={styles.devValue}>+919111111001 / driver123</Text>
                        </View>
                        <View style={styles.devCredential}>
                            <Text style={styles.devLabel}>Supervisor:</Text>
                            <Text style={styles.devValue}>+919000000001 / supervisor123</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Powered by SAIL • Steel Authority of India Limited
                </Text>
                <Text style={styles.version}>Version 1.0.0 • Phase 3</Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    header: {
        backgroundColor: Colors.sail.navy,
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.text.inverse,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.sail.gold,
    },
    logoText: {
        fontFamily: Typography.sans.family,
        fontSize: 24,
        fontWeight: Typography.sans.weights.heavy,
        color: Colors.sail.navy,
        letterSpacing: 2,
    },
    title: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.title,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.inverse,
        letterSpacing: 1,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.caption,
        color: Colors.sail.lightBlue,
        textAlign: 'center',
        marginBottom: 12,
    },
    divider: {
        width: 60,
        height: 3,
        backgroundColor: Colors.sail.gold,
        marginVertical: 8,
    },
    organization: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.caption,
        color: Colors.sail.lightBlue,
        fontWeight: Typography.sans.weights.semibold,
        letterSpacing: 1.5,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    formCard: {
        backgroundColor: Colors.background.card,
        borderRadius: 12,
        padding: 24,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    formTitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.heading,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.sail.navy,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.caption,
        fontWeight: Typography.sans.weights.semibold,
        color: Colors.text.secondary,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputWrapper: {
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: 8,
        backgroundColor: Colors.background.secondary,
    },
    input: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.primary,
    },
    loginButton: {
        backgroundColor: Colors.sail.blue,
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: Colors.sail.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        fontWeight: Typography.sans.weights.bold,
        color: Colors.text.inverse,
        letterSpacing: 1.5,
    },
    devHelper: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    devHelperTitle: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        fontWeight: Typography.sans.weights.semibold,
        color: Colors.text.tertiary,
        marginBottom: 12,
    },
    devCredential: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    devLabel: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
        width: 100,
    },
    devValue: {
        fontFamily: Typography.mono.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.secondary,
        flex: 1,
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
        textAlign: 'center',
    },
    version: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.small,
        color: Colors.text.tertiary,
        marginTop: 4,
    },
});