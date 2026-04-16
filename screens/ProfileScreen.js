import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    RefreshControl, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/theme';
import { getPostsByUser, uploadImage, updateMe, getImageUrl } from '../api/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function ProfileScreen({ navigation }) {
    const { user, logout, refreshUser } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const fetchPosts = async () => {
        if (!user?.id) return;
        try {
            const res = await getPostsByUser(user.id);
            const sorted = res.data.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setPosts(sorted);
        } catch (e) {
            console.log('Profile posts error:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Refresh user data and posts every time Profile tab is focused
    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                setLoading(true);
                try {
                    await refreshUser(); // always get latest user data from backend
                } catch (e) {
                    console.log('Refresh user error:', e.message);
                }
                await fetchPosts();
            };
            load();
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshUser();
        } catch (e) {}
        await fetchPosts();
    }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    navigation.replace('Login');
                },
            },
        ]);
    };

    // Use the actual username from backend user object
    const handlePickAvatar = async () => {
        const options = [
            {
                text: 'Camera',
                onPress: async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission needed', 'Please enable camera access in Settings.');
                        return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ['images'],
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.8,
                    });
                    if (!result.canceled && result.assets?.[0]?.uri) {
                        await doUploadAvatar(result.assets[0].uri);
                    }
                },
            },
            {
                text: 'Gallery',
                onPress: async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission needed', 'Please enable photo library access in Settings.');
                        return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.8,
                    });
                    if (!result.canceled && result.assets?.[0]?.uri) {
                        await doUploadAvatar(result.assets[0].uri);
                    }
                },
            },
        ];

        // Only show Remove option if they have an avatar
        if (user?.avatarUrl) {
            options.push({
                text: 'Remove Photo',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await updateMe({ username: user.username, avatarUrl: null });
                        await refreshUser();
                        Alert.alert('Done', 'Profile photo removed.');
                    } catch (e) {
                        Alert.alert('Error', 'Could not remove photo.');
                    }
                },
            });
        }

        options.push({ text: 'Cancel', style: 'cancel' });
        Alert.alert('Profile Photo', 'Choose an option', options);
    };

    const doUploadAvatar = async (uri) => {
        setUploadingAvatar(true);
        try {
            const url = await uploadImage(uri);
            await updateMe({ username: user.username, avatarUrl: url });
            await refreshUser();
            Alert.alert('✅', 'Avatar updated!');
        } catch (e) {
            console.log('Avatar upload error:', e.message);
            Alert.alert('Error', 'Could not update avatar. Please try again.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const displayUsername = user?.username || 'Username';
    const avatarLetter = displayUsername.charAt(0).toUpperCase();
    const avatarImageUrl = getImageUrl(user?.avatarUrl);

    const ListHeader = () => (
        <View>
            {/* Cover banner */}
            <View style={styles.cover} />

            {/* Avatar + Edit button */}
            <View style={styles.profileRow}>
                <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatar}>
                            {uploadingAvatar ? (
                                <ActivityIndicator color="#fff" />
                            ) : avatarImageUrl ? (
                                <Image
                                    source={{ uri: avatarImageUrl }}
                                    style={styles.avatarImage}
                                    onError={() => {}}
                                />
                            ) : (
                                <Text style={styles.avatarText}>{avatarLetter}</Text>
                            )}
                        </View>
                        <View style={styles.cameraOverlay}>
                            <Text style={styles.cameraIcon}>📷</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>

            {/* User info — sourced directly from backend */}
            <View style={styles.userInfo}>
                <Text style={styles.username}>{displayUsername}</Text>
                <Text style={styles.handle}>@{displayUsername}</Text>
                {user?.email && (
                    <Text style={styles.email}>{user.email}</Text>
                )}
            </View>

            {/* Stats */}
            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{posts.length}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {posts.reduce((sum, p) => sum + (p.likeCount || 0), 0)}
                    </Text>
                    <Text style={styles.statLabel}>Likes received</Text>
                </View>
            </View>

            {/* Posts header */}
            <View style={styles.postsHeader}>
                <Text style={styles.postsHeaderText}>Posts ({posts.length})</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Settings / Logout button */}
            <TouchableOpacity style={styles.settingsBtn} onPress={handleLogout}>
                <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={ListHeader}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyIcon}>📝</Text>
                            <Text style={styles.emptyText}>No posts yet</Text>
                            <Text style={styles.emptySubtext}>Submit a report to see it here</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <PostCard
                            post={item}
                            currentUserId={user?.id}
                            onPress={() => navigation.navigate('PostDetail', { post: item })}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    settingsBtn: { position: 'absolute', top: 56, right: 16, zIndex: 10 },
    settingsIcon: { fontSize: 22 },
    cover: { height: 120, backgroundColor: COLORS.primary + '30' },
    profileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        marginTop: -30,
        marginBottom: 8,
    },
    avatarWrapper: {
        borderWidth: 4,
        borderColor: '#fff',
        borderRadius: 40,
        position: 'relative',
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    cameraIcon: { fontSize: 12 },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 30 },
    editBtn: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
    },
    editBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    userInfo: { paddingHorizontal: 16, marginBottom: 16, gap: 2 },
    username: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    handle: { fontSize: 14, color: COLORS.textSecondary },
    email: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
    stats: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 4,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: COLORS.border },
    postsHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    postsHeaderText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
    emptyIcon: { fontSize: 40 },
    emptyText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    emptySubtext: { fontSize: 13, color: COLORS.textSecondary },
});