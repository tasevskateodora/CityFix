import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen({ navigation }) {
    const { user, loading } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate logo in
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // After logo appears, fade in the button
            Animated.timing(buttonAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    const handleStart = () => {
        if (user) {
            navigation.replace('MainTabs');
        } else {
            navigation.replace('Onboarding');
        }
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
            >
                <View style={styles.logoContainer}>
                    <Text style={styles.logoIcon}>🏙️</Text>
                </View>
                <Text style={styles.title}>Cityfix</Text>
                <Text style={styles.subtitle}>Report issues, improve your city.</Text>
            </Animated.View>

            <Animated.View style={[styles.buttonWrapper, { opacity: buttonAnim }]}>
                {loading ? (
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
                ) : (
                    <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
                        <Text style={styles.startBtnText}>Get Started</Text>
                    </TouchableOpacity>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: { alignItems: 'center' },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logoIcon: { fontSize: 52 },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 8,
    },
    buttonWrapper: {
        position: 'absolute',
        bottom: 60,
        left: 24,
        right: 24,
        alignItems: 'center',
    },
    startBtn: {
        width: '100%',
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    startBtnText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '700',
    },
});