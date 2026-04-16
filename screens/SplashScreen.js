import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen({ navigation }) {
    const { user, loading } = useAuth();
    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0.8);

    useEffect(() => {
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
        ]).start();
    }, []);

    useEffect(() => {
        if (!loading) {
            setTimeout(() => {
                if (user) {
                    navigation.replace('MainTabs');
                } else {
                    navigation.replace('Onboarding');
                }
            }, 1800);
        }
    }, [loading, user]);

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
});