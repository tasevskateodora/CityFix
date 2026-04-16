import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    Dimensions, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, CATEGORY_COLORS, CATEGORY_ICONS } from '../constants/theme';
import { getAllPosts, getImageUrl } from '../api/api';

const { width } = Dimensions.get('window');

export default function MapScreen({ navigation }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const mapRef = useRef(null);

    const DEFAULT_REGION = {
        latitude: 41.9981,
        longitude: 21.4254,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    useEffect(() => {
        fetchPosts();
        getLocation();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await getAllPosts();
            setPosts(res.data.filter((p) => p.latitude && p.longitude));
        } catch (e) {
            console.log('Map fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const getLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setUserLocation(loc.coords);
            }
        } catch (e) {
            console.log('Location error:', e);
        }
    };

    const centerOnUser = () => {
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Search bar overlay */}
            <View style={styles.searchOverlay}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <Text style={styles.searchPlaceholder}>Search location or issue...</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={
                        userLocation
                            ? {
                                latitude: userLocation.latitude,
                                longitude: userLocation.longitude,
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            }
                            : DEFAULT_REGION
                    }
                    showsUserLocation
                    showsMyLocationButton={false}
                >
                    {posts.map((post) => (
                        <Marker
                            key={post.id}
                            coordinate={{
                                latitude: parseFloat(post.latitude),
                                longitude: parseFloat(post.longitude),
                            }}
                            onPress={() => setSelectedPost(post)}
                        >
                            <View style={[
                                styles.markerContainer,
                                { backgroundColor: CATEGORY_COLORS[post.category] || COLORS.primary }
                            ]}>
                                <Text style={styles.markerIcon}>
                                    {CATEGORY_ICONS[post.category] || '📍'}
                                </Text>
                            </View>
                        </Marker>
                    ))}
                </MapView>
            )}

            {/* My location button */}
            <TouchableOpacity style={styles.locationBtn} onPress={centerOnUser}>
                <Text style={styles.locationBtnIcon}>📍</Text>
            </TouchableOpacity>

            {/* Selected post preview */}
            {selectedPost && (
                <View style={styles.postPreview}>
                    <TouchableOpacity
                        style={styles.previewClose}
                        onPress={() => setSelectedPost(null)}
                    >
                        <Text style={styles.previewCloseIcon}>✕</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            setSelectedPost(null);
                            navigation.navigate('PostDetail', { post: selectedPost });
                        }}
                    >
                        <View style={styles.previewContent}>
                            {selectedPost.imageUrl && (
                                <Image
                                    source={{ uri: getImageUrl(selectedPost.imageUrl) }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                />
                            )}
                            <View style={styles.previewInfo}>
                                <View style={styles.previewHeader}>
                                    <View style={styles.previewAvatar}>
                                        <Text style={styles.previewAvatarText}>
                                            {(selectedPost.username || 'U').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.previewUsername}>{selectedPost.username}</Text>
                                        <View style={[
                                            styles.previewCat,
                                            { backgroundColor: (CATEGORY_COLORS[selectedPost.category] || COLORS.primary) + '20' }
                                        ]}>
                                            <Text style={[
                                                styles.previewCatText,
                                                { color: CATEGORY_COLORS[selectedPost.category] || COLORS.primary }
                                            ]}>
                                                {CATEGORY_ICONS[selectedPost.category]} {selectedPost.category}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.previewDescription} numberOfLines={2}>
                                    {selectedPost.description}
                                </Text>
                                <Text style={styles.previewTap}>Tap to see details →</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    searchOverlay: {
        position: 'absolute',
        top: 100,
        left: 16,
        right: 16,
        zIndex: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        gap: 8,
    },
    searchIcon: { fontSize: 16 },
    searchPlaceholder: { fontSize: 14, color: COLORS.textLight },
    markerContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    markerIcon: { fontSize: 16 },
    locationBtn: {
        position: 'absolute',
        bottom: 200,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    locationBtnIcon: { fontSize: 22 },
    postPreview: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    previewClose: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        padding: 4,
    },
    previewCloseIcon: { fontSize: 16, color: COLORS.textSecondary },
    previewContent: { flexDirection: 'row', gap: 12 },
    previewImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: COLORS.border,
    },
    previewInfo: { flex: 1, gap: 6 },
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    previewAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    previewCat: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    previewCatText: { fontSize: 11, fontWeight: '600' },
    previewUsername: { fontSize: 13, fontWeight: '600', color: COLORS.text },
    previewDescription: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
    previewTap: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
});