import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    Alert, ActivityIndicator, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../theme';
import { useAuthStore } from '../store/authStore';

// Custom SVG Icons
const BadgeIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8896A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="4" width="18" height="16" rx="2" />
        <Path d="M16 2v2M8 2v2" />
        <Circle cx="12" cy="11" r="3" />
        <Path d="M8 18h8" />
    </Svg>
);

const LockIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8896A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <Path d="M7 11V7a5 5 0 0110 0v4" />
    </Svg>
);

const EyeIcon = ({ visible }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8896A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {visible ? (
            <>
                <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <Path d="M1 1L23 23" />
            </>
        ) : (
            <>
                <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <Circle cx="12" cy="12" r="3" />
            </>
        )}
    </Svg>
);

const ShieldIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <Path d="M9 11l2 2 4-4" fill="none" />
    </Svg>
);

const SecureShieldIcon = () => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A6B88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <Path d="M9 11l2 2 4-4" />
    </Svg>
);

export const LoginScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [focused, setFocused] = useState(null);
    const [showCreds, setShowCreds] = useState(false);
    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Missing Fields', 'Please enter your credentials.');
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
        <SafeAreaView style={styles.safeArea} edges={[]}>
            <StatusBar barStyle="light-content" backgroundColor="#CC0000" />
            
            {/* Red top safety banner */}
            <View style={styles.topBanner}>
                <Text style={styles.topBannerText}>SAFETY FIRST • ZERO HARM • INTEGRITY ALWAYS</Text>
            </View>

            <LinearGradient
                colors={['#07162C', '#0A2244']}
                style={styles.gradientContainer}
            >
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        
                        {/* Auth Card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.blueBar} />
                                <View style={styles.headerTextContainer}>
                                    <Text style={styles.cardTitle}>Operator Authentication</Text>
                                    <Text style={styles.cardSubtitle}>Enter credentials to access digital oversight systems.</Text>
                                </View>
                            </View>

                            {error ? (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>⚠ {error}</Text>
                                </View>
                            ) : null}

                            {/* Driver ID field */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>DRIVER / EMPLOYEE ID</Text>
                                <View style={[styles.inputWrap, focused === 'phone' && styles.inputWrapFocused]}>
                                    <View style={styles.inputIconContainer}>
                                        <BadgeIcon />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: SAIL123456"
                                        placeholderTextColor="#8896A8"
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

                            {/* Password field */}
                            <View style={styles.fieldGroup}>
                                <View style={styles.passwordLabelRow}>
                                    <Text style={styles.fieldLabel}>PIN / PASSWORD</Text>
                                    <TouchableOpacity onPress={() => Alert.alert('Forgot Credentials', 'Please contact industrial security desk for credentials reset.')}>
                                        <Text style={styles.forgotLink}>Forgot Credentials?</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputWrap, focused === 'pass' && styles.inputWrapFocused]}>
                                    <View style={styles.inputIconContainer}>
                                        <LockIcon />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#8896A8"
                                        secureTextEntry={!showPass}
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setFocused('pass')}
                                        onBlur={() => setFocused(null)}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                                        <EyeIcon visible={showPass} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Authorize Access Button */}
                            <TouchableOpacity
                                style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.85}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <Text style={styles.loginBtnText}>AUTHORIZE ACCESS</Text>
                                        <ShieldIcon />
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {/* Secure established link */}
                            <View style={styles.secureBox}>
                                <View style={styles.secureTitleRow}>
                                    <SecureShieldIcon />
                                    <Text style={styles.secureTitleText}>SECURE LINK ESTABLISHED</Text>
                                </View>
                                <Text style={styles.secureSubtext}>
                                    Unauthorized access attempts are logged and reported to industrial security.
                                </Text>
                            </View>
                        </View>

                        {/* Company branding */}
                        <Text style={styles.brandingText}>STEEL AUTHORITY OF INDIA LIMITED</Text>

                        {/* Privacy / Safety / Support links */}
                        <View style={styles.linksRow}>
                            <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'Standard SAIL Privacy Policy applies.')}>
                                <Text style={styles.linkItem}>PRIVACY POLICY</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => Alert.alert('Safety Protocols', 'SAIL Speed & Safety Rules 2024.')}>
                                <Text style={styles.linkItem}>SAFETY PROTOCOLS</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowCreds(!showCreds)}>
                                <Text style={styles.linkItem}>SUPPORT</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Support Test Credentials */}
                        {showCreds && (
                            <View style={styles.credsBox}>
                                <Text style={styles.credsTitle}>TEST CREDENTIALS</Text>
                                <CredRow role="Driver" value="+919111111001 / driver123" />
                            </View>
                        )}

                        {/* Footer legal & version */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>© 2024 SAIL INDUSTRIAL SECURITY PLATFORM</Text>
                            <Text style={styles.footerVersion}>VERSION 4.2.0-PRO</Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const CredRow = ({ role, value }) => (
    <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Text style={{ fontSize: 10, color: '#A0AEC0', width: 60, fontWeight: '600' }}>{role}:</Text>
        <Text style={{ fontSize: 10, color: '#FFFFFF', fontFamily: 'monospace' }}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#CC0000' },
    topBanner: {
        backgroundColor: '#CC0000',
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    topBannerText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.8,
    },
    gradientContainer: {
        flex: 1,
    },
    container: { flex: 1 },
    scrollContainer: {
        paddingHorizontal: 24,
        paddingTop: 36,
        paddingBottom: 40,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 28,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
        gap: 12,
    },
    blueBar: {
        width: 4,
        height: 44,
        backgroundColor: '#0A1931',
        borderRadius: 2,
    },
    headerTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0A1931',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#718096',
        lineHeight: 16,
    },
    errorBox: {
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    errorText: { fontSize: 13, color: '#EF4444', lineHeight: 18 },
    fieldGroup: { marginBottom: 20 },
    passwordLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    fieldLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4A5568',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    forgotLink: {
        fontSize: 10,
        color: '#5C6B73',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        backgroundColor: '#EEF2F6',
        paddingHorizontal: 12,
        height: 52,
    },
    inputWrapFocused: {
        borderColor: '#0A1931',
        backgroundColor: '#FFFFFF',
    },
    inputIconContainer: {
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#0A1931',
        fontWeight: '500',
    },
    eyeBtn: {
        padding: 6,
    },
    loginBtn: {
        backgroundColor: '#0A1931',
        borderRadius: 8,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    loginBtnDisabled: { opacity: 0.6 },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loginBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 20,
    },
    secureBox: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    secureTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    secureTitleText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#3A6B88',
        letterSpacing: 0.5,
    },
    secureSubtext: {
        fontSize: 10,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 14,
    },
    brandingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#718096',
        letterSpacing: 1,
        marginBottom: 16,
    },
    linksRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    linkItem: {
        fontSize: 10,
        color: '#3B82F6',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    credsBox: {
        width: '100%',
        padding: 12,
        backgroundColor: '#101C36',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1A2E5A',
        marginBottom: 20,
    },
    credsTitle: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFB81C',
        letterSpacing: 1,
        marginBottom: 4,
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
    },
    footerText: { fontSize: 10, color: '#718096' },
    footerVersion: { fontSize: 9, color: '#4A5568', marginTop: 2, fontWeight: '700' },
});