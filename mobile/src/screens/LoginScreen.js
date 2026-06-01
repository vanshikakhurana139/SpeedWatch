import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../theme';
import { useAuthStore } from '../store/authStore';

export const LoginScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [focused, setFocused] = useState(null);
    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Missing Fields', 'Please enter your phone number and password.');
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
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.sail.navy} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Navy header block */}
                <View style={styles.header}>
                    <View style={styles.logoRow}>
                        <View style={styles.sailCircle}>
                            <Text style={styles.sailText}>SAIL</Text>
                        </View>
                        <View style={styles.logoTextBlock}>
                            <Text style={styles.appName}>SpeedWatch</Text>
                            <Text style={styles.appTagline}>Industrial Speed Enforcement</Text>
                        </View>
                    </View>
                    <View style={styles.goldBar} />
                    <Text style={styles.orgLabel}>RDCIS RANCHI</Text>
                </View>

                {/* Form */}
                <View style={styles.body}>
                    <Text style={styles.formTitle}>Driver Login</Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>⚠ {error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
                        <View style={[styles.inputWrap, focused === 'phone' && styles.inputWrapFocused]}>
                            <TextInput
                                style={styles.input}
                                placeholder="+91 XXXXXXXXXX"
                                placeholderTextColor={Colors.text.tertiary}
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                                onFocus={() => setFocused('phone')}
                                onBlur={() => setFocused(null)}
                                autoCapitalize="none"
                                maxLength={15}
                            />
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>PASSWORD</Text>
                        <View style={[styles.inputWrap, focused === 'pass' && styles.inputWrapFocused]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.text.tertiary}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setFocused('pass')}
                                onBlur={() => setFocused(null)}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.85}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.loginBtnText}>LOGIN</Text>
                        )}
                    </TouchableOpacity>

                    {/* Test creds */}
                    <View style={styles.credsBox}>
                        <Text style={styles.credsTitle}>TEST CREDENTIALS</Text>
                        <CredRow role="Driver" value="+919111111001 / driver123" />
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Steel Authority of India Limited</Text>
                    <Text style={styles.footerVersion}>Version 4.0  ·  RDCIS</Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const CredRow = ({ role, value }) => (
    <View style={{ flexDirection: 'row', marginTop: 6 }}>
        <Text style={{ fontSize: 11, color: Colors.text.tertiary, width: 70, fontWeight: '600' }}>{role}:</Text>
        <Text style={{ fontSize: 11, color: Colors.text.secondary, fontFamily: 'monospace' }}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.sail.navy },
    container: { flex: 1, backgroundColor: Colors.background.primary },
    header: {
        backgroundColor: Colors.sail.navy,
        paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28,
    },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    sailCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: 'white',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: Colors.sail.gold,
    },
    sailText: {
        fontFamily: Typography.sans.family,
        fontSize: 20, fontWeight: '800',
        color: Colors.sail.navy, letterSpacing: 2,
    },
    logoTextBlock: { flex: 1 },
    appName: {
        fontFamily: Typography.sans.family,
        fontSize: 30, fontWeight: '800',
        color: 'white', letterSpacing: 0.5,
    },
    appTagline: {
        fontSize: 13, color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    goldBar: { height: 3, width: 48, backgroundColor: Colors.sail.gold, marginBottom: 16 },
    orgLabel: {
        fontFamily: Typography.sans.family,
        fontSize: 11, fontWeight: '700',
        color: 'rgba(255,255,255,0.5)', letterSpacing: 3,
    },
    body: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 28,
        backgroundColor: Colors.background.primary,
    },
    formTitle: {
        fontFamily: Typography.sans.family,
        fontSize: 24, fontWeight: '700',
        color: Colors.sail.navy,
        marginBottom: 20,
    },
    errorBox: {
        backgroundColor: 'rgba(240,65,75,0.08)',
        borderWidth: 1, borderColor: 'rgba(240,65,75,0.25)',
        borderLeftWidth: 4, borderLeftColor: '#F0414B',
        borderRadius: 8, padding: 12, marginBottom: 16,
    },
    errorText: { fontSize: 13, color: '#C0182B', lineHeight: 18 },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: {
        fontSize: 10, fontWeight: '700',
        color: Colors.text.tertiary, letterSpacing: 1.5,
        marginBottom: 8,
    },
    inputWrap: {
        borderWidth: 1.5, borderColor: Colors.border,
        borderRadius: 10, backgroundColor: Colors.background.card,
    },
    inputWrapFocused: { borderColor: Colors.sail.blue },
    input: {
        paddingVertical: 14, paddingHorizontal: 16,
        fontSize: Typography.sans.sizes.body,
        color: Colors.text.primary,
        fontFamily: Typography.sans.family,
    },
    loginBtn: {
        backgroundColor: Colors.sail.blue,
        borderRadius: 10, paddingVertical: 16,
        alignItems: 'center', marginTop: 4,
        shadowColor: Colors.sail.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
    },
    loginBtnDisabled: { opacity: 0.6 },
    loginBtnText: {
        fontFamily: Typography.sans.family,
        fontSize: Typography.sans.sizes.body,
        fontWeight: '700', color: 'white', letterSpacing: 2,
    },
    credsBox: {
        marginTop: 24, padding: 14,
        backgroundColor: Colors.background.secondary,
        borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    },
    credsTitle: {
        fontSize: 9, fontWeight: '700', color: Colors.sail.gold,
        letterSpacing: 1.5, marginBottom: 4,
    },
    footer: {
        paddingVertical: 20, alignItems: 'center',
        backgroundColor: Colors.background.primary,
    },
    footerText: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'center' },
    footerVersion: { fontSize: 11, color: '#CBD5E0', marginTop: 4 },
});