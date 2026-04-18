import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    Image, TextInput, Keyboard, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '../constants/theme';
import { getAllPosts, getImageUrl } from '../api/api';

export default function MapScreen({ navigation }) {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const mapRef = useRef(null);

    const DEFAULT_REGION = {
        latitude: 41.9981,
        longitude: 21.4254,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    useFocusEffect(
        useCallback(() => {
            fetchPosts();
            getLocation();
        }, [])
    );

    const fetchPosts = async () => {
        try {
            const res = await getAllPosts();
            const withCoords = res.data.filter((p) => p.latitude && p.longitude);
            setPosts(withCoords);
            setFilteredPosts(withCoords);
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
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
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

    const handleSearch = (text) => {
        setSearch(text);
        if (!text.trim()) {
            setFilteredPosts(posts);
            setSuggestions([]);
            return;
        }
        const lower = text.toLowerCase();
        const matched = posts.filter(
            (p) =>
                p.description?.toLowerCase().includes(lower) ||
                p.category?.toLowerCase().includes(lower) ||
                p.username?.toLowerCase().includes(lower) ||
                CATEGORY_LABELS[p.category]?.toLowerCase().includes(lower)
        );
        setFilteredPosts(matched);
        setSuggestions(matched.slice(0, 5));
    };

    const handleSelectSuggestion = (post) => {
        setSearch(post.description?.substring(0, 40) || '');
        setSuggestions([]);
        setSelectedPost(post);
        Keyboard.dismiss();
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: parseFloat(post.latitude),
                longitude: parseFloat(post.longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        setSuggestions([]);
        setFilteredPosts(posts);
        Keyboard.dismiss();
    };

    const handleMapLongPress = (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        Alert.alert(
            'Report an Issue Here?',
            'Submit a report at this location?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Report Here',
                    onPress: () => {
                        navigation.navigate('Report', {
                            screen: 'ReportMain',
                            params: { prefillLatitude: latitude, prefillLongitude: longitude },
                        });
                    },
                },
            ]
        );
    };

    const handleMapPress = () => {
        setSelectedPost(null);
        setSuggestions([]);
        Keyboard.dismiss();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Search bar */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search reports, categories..."
                        placeholderTextColor={COLORS.textLight}
                        value={search}
                        onChangeText={handleSearch}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch}>
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Suggestions dropdown */}
                {suggestions.length > 0 && (
                    <View style={styles.suggestions}>
                        {suggestions.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.suggestionItem}
                                onPress={() => handleSelectSuggestion(item)}
                            >
                                <Text style={styles.suggestionIcon}>
                                    {CATEGORY_ICONS[item.category] || '📍'}
                                </Text>
                                <View style={styles.suggestionText}>
                                    <Text style={styles.suggestionTitle} numberOfLines={1}>
                                        {item.description}
                                    </Text>
                                    <Text style={styles.suggestionSub}>
                                        {CATEGORY_LABELS[item.category] || item.category} · {item.username}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
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
                    onPress={handleMapPress}
                    onLongPress={handleMapLongPress}
                >
                    {filteredPosts.map((post) => (
                        <Marker
                            key={post.id}
                            coordinate={{
                                latitude: parseFloat(post.latitude),
                                longitude: parseFloat(post.longitude),
                            }}
                            onPress={() => {
                                setSelectedPost(post);
                                setSuggestions([]);
                            }}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.markerContainer,
                                    { backgroundColor: CATEGORY_COLORS[post.category] || COLORS.primary },
                                    selectedPost?.id === post.id && styles.markerSelected,
                                ]}
                                onPress={() => navigation.navigate('PostDetail', { post })}
                            >
                                <Text style={styles.markerIcon}>
                                    {CATEGORY_ICONS[post.category] || '📍'}
                                </Text>
                            </TouchableOpacity>
                        </Marker>
                    ))}
                </MapView>
            )}

            {/* Long press hint */}
            {!loading && (
                <View style={styles.hintBox}>
                    <Text style={styles.hintText}>💡 Long press to report an issue here</Text>
                </View>
            )}

            {/* My location button */}
            <TouchableOpacity style={styles.locationBtn} onPress={centerOnUser}>
                <Text style={styles.locationBtnIcon}>📍</Text>
            </TouchableOpacity>

            {/* Results count when searching */}
            {search.length > 0 && (
                <View style={styles.resultsCount}>
                    <Text style={styles.resultsCountText}>
                        {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            )}

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
                            {!!(selectedPost.imageUrl && getImageUrl(selectedPost.imageUrl)?.startsWith('http')) && (
                                <Image
                                    source={{ uri: getImageUrl(selectedPost.imageUrl) }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                    onError={() => {}}
                                />
                            )}
                            <View style={styles.previewInfo}>
                                <View style={styles.previewHeader}>
                                    <View style={styles.previewAvatar}>
                                        <Text style={styles.previewAvatarText}>
                                            {(selectedPost.username || 'U').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.previewUsername}>{selectedPost.username}</Text>
                                        <View style={[
                                            styles.previewCat,
                                            { backgroundColor: (CATEGORY_COLORS[selectedPost.category] || COLORS.primary) + '20' },
                                        ]}>
                                            <Text style={[
                                                styles.previewCatText,
                                                { color: CATEGORY_COLORS[selectedPost.category] || COLORS.primary },
                                            ]}>
                                                {CATEGORY_ICONS[selectedPost.category]} {CATEGORY_LABELS[selectedPost.category] || selectedPost.category}
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
    loadingContainer: {
        flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
    },
    searchWrapper: {
        position: 'absolute',
        top: 100,
        left: 16,
        right: 16,
        zIndex: 20,
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
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
        gap: 8,
    },
    searchIcon: { fontSize: 16 },
    searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
    clearIcon: { fontSize: 14, color: COLORS.textLight, padding: 4 },
    suggestions: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginTop: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 10,
    },
    suggestionIcon: { fontSize: 20 },
    suggestionText: { flex: 1 },
    suggestionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
    suggestionSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    hintBox: {
        position: 'absolute',
        top: 160,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    hintText: { color: '#fff', fontSize: 12 },
    markerContainer: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
    },
    markerSelected: {
        width: 44, height: 44, borderRadius: 22,
        borderWidth: 3, borderColor: COLORS.primary,
    },
    markerIcon: { fontSize: 16 },
    locationBtn: {
        position: 'absolute',
        bottom: 220,
        right: 16,
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    locationBtnIcon: { fontSize: 22 },
    resultsCount: {
        position: 'absolute',
        bottom: 220,
        left: 16,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    resultsCountText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    postPreview: {
        position: 'absolute',
        bottom: 20,
        left: 16, right: 16,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
    },
    previewClose: {
        position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 4,
    },
    previewCloseIcon: { fontSize: 16, color: COLORS.textSecondary },
    previewContent: { flexDirection: 'row', gap: 12 },
    previewImage: {
        width: 80, height: 80, borderRadius: 12, backgroundColor: COLORS.border,
    },
    previewInfo: { flex: 1, gap: 6 },
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    previewAvatar: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    },
    previewAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    previewCat: {
        alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    },
    previewCatText: { fontSize: 11, fontWeight: '600' },
    previewUsername: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
    previewDescription: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
    previewTap: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
});