import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/api';

export default function LoginScreen({ navigation }) {
    const [tab, setTab] = useState('login');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Login fields
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register fields
    const [regFullName, setRegFullName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');

    const { login } = useAuth();

    const handleLogin = async () => {
        if (!loginUsername || !loginPassword) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }
        setLoading(true);
        try {
            await login(loginUsername, loginPassword);
            navigation.replace('MainTabs');
        } catch (e) {
            Alert.alert('Login Failed', 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!regFullName || !regEmail || !regUsername || !regPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await register({
                username: regUsername,
                email: regEmail,
                password: regPassword,
                avatarUrl: null,
            });
            Alert.alert('Success', 'Account created! Please log in.', [
                { text: 'OK', onPress: () => setTab('login') },
            ]);
        } catch (e) {
            const msg = e.response?.data?.message || 'Registration failed';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                    {/* Header */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>

                    <Text style={styles.heading}>
                        {tab === 'login' ? 'Welcome Back' : 'Create an Account'}
                    </Text>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
                            onPress={() => setTab('login')}
                        >
                            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                                Login
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
                            onPress={() => setTab('register')}
                        >
                            <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Login Form */}
                    {tab === 'login' && (
                        <View style={styles.form}>
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                placeholderTextColor={COLORS.textLight}
                                value={loginUsername}
                                onChangeText={setLoginUsername}
                                autoCapitalize="none"
                            />
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Password"
                                    placeholderTextColor={COLORS.textLight}
                                    value={loginPassword}
                                    onChangeText={setLoginPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Sign In</Text>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.switchText}>
                                Don't have an account?{' '}
                                <Text style={styles.switchLink} onPress={() => setTab('register')}>
                                    Create Account
                                </Text>
                            </Text>
                        </View>
                    )}

                    {/* Register Form */}
                    {tab === 'register' && (
                        <View style={styles.form}>
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor={COLORS.textLight}
                                value={regFullName}
                                onChangeText={setRegFullName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                placeholderTextColor={COLORS.textLight}
                                value={regUsername}
                                onChangeText={setRegUsername}
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor={COLORS.textLight}
                                value={regEmail}
                                onChangeText={setRegEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Password"
                                    placeholderTextColor={COLORS.textLight}
                                    value={regPassword}
                                    onChangeText={setRegPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Next</Text>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.switchText}>
                                Already have an account?{' '}
                                <Text style={styles.switchLink} onPress={() => setTab('login')}>
                                    Login
                                </Text>
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
    backBtn: { marginBottom: 24 },
    backArrow: { fontSize: 24, color: COLORS.primary },
    heading: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 28,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.border,
        borderRadius: 12,
        padding: 4,
        marginBottom: 28,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
    tabTextActive: { color: COLORS.primary, fontWeight: '600' },
    form: { gap: 14 },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    passwordInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.text },
    eyeIcon: { fontSize: 18 },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    switchText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 14, marginTop: 8 },
    switchLink: { color: COLORS.primary, fontWeight: '600' },
});