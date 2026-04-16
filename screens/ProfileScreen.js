import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { getPostsByUser } from '../api/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function ProfileScreen({ navigation }) {
    const { user, logout, refreshUser } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');

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
    const displayUsername = user?.username || 'Username';
    const avatarLetter = displayUsername.charAt(0).toUpperCase();

    const ListHeader = () => (
        <View>
            {/* Cover banner */}
            <View style={styles.cover} />

            {/* Avatar + Edit button */}
            <View style={styles.profileRow}>
                <View style={styles.avatarWrapper}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{avatarLetter}</Text>
                    </View>
                </View>
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
                    <Text style={styles.statLabel}>Likes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {posts.filter((p) => p.status === 'RESOLVED').length}
                    </Text>
                    <Text style={styles.statLabel}>Resolved</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {['posts', 'likes', 'comments', 'shares'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'posts'
                                ? `Post (${posts.length})`
                                : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
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
                    data={activeTab === 'posts' ? posts : []}
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
                            {activeTab === 'posts' ? (
                                <>
                                    <Text style={styles.emptyIcon}>📝</Text>
                                    <Text style={styles.emptyText}>No posts yet</Text>
                                    <Text style={styles.emptySubtext}>Submit a report to see it here</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.emptyIcon}>🚧</Text>
                                    <Text style={styles.emptyText}>Coming soon</Text>
                                </>
                            )}
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
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
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
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
    tabTextActive: { color: COLORS.primary, fontWeight: '600' },
    empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
    emptyIcon: { fontSize: 40 },
    emptyText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    emptySubtext: { fontSize: 13, color: COLORS.textSecondary },
});