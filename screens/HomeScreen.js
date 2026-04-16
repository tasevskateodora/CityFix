import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from '../constants/theme';
import { getAllPosts } from '../api/api';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'road_damage', 'traffic_signal', 'lighting', 'flooding', 'waste', 'sidewalk', 'vandalism'];

export default function HomeScreen({ navigation }) {
    const [posts, setPosts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const { user } = useAuth();

    const fetchPosts = async () => {
        try {
            const res = await getAllPosts();
            const sorted = res.data.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setPosts(sorted);
            applyFilters(sorted, activeCategory, search);
        } catch (e) {
            console.log('Fetch posts error:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Refresh every time the Home tab comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchPosts();
        }, [])
    );

    const applyFilters = (data, category, searchText) => {
        let result = data;
        if (category !== 'All') {
            result = result.filter((p) => p.category === category);
        }
        if (searchText) {
            result = result.filter((p) =>
                p.description?.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        setFiltered(result);
    };

    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
        applyFilters(posts, cat, search);
    };

    const handleSearchChange = (text) => {
        setSearch(text);
        applyFilters(posts, activeCategory, text);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPosts();
    }, []);

    const renderCategory = (cat) => {
        const isActive = activeCategory === cat;
        const icon = cat === 'All' ? '🗺️' : CATEGORY_ICONS[cat];
        const label = cat === 'All' ? 'All' : CATEGORY_LABELS[cat];
        return (
            <TouchableOpacity
                key={cat}
                style={[styles.catChip, isActive && styles.catChipActive]}
                onPress={() => handleCategoryChange(cat)}
            >
                <Text style={styles.catIcon}>{icon}</Text>
                <Text style={[styles.catText, isActive && styles.catTextActive]} numberOfLines={1}>{label}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Search bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search location or issue..."
                    placeholderTextColor={COLORS.textLight}
                    value={search}
                    onChangeText={handleSearchChange}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearchChange('')}>
                        <Text style={styles.clearIcon}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Category filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categories}
            >
                {CATEGORIES.map((cat) => renderCategory(cat))}
            </ScrollView>

            {/* Posts feed */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.feed}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No posts found</Text>
                        <Text style={styles.emptySubtext}>Pull down to refresh</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <PostCard
                        key={`${item.id}-${item.likeCount}-${item.commentCount}`}
                        post={item}
                        currentUserId={user?.id}
                        onPress={() => navigation.navigate('PostDetail', { post: item })}
                    />
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
    clearIcon: { fontSize: 14, color: COLORS.textLight, padding: 4 },
    categories: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 30,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: COLORS.border,
        gap: 6,
        minWidth: 80,
    },
    catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    catIcon: { fontSize: 18 },
    catText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
    catTextActive: { color: '#fff' },
    feed: { paddingTop: 4, paddingBottom: 24 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
    emptyIcon: { fontSize: 48, marginBottom: 4 },
    emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    emptySubtext: { fontSize: 14, color: COLORS.textSecondary },
});