import React, { useState, useCallback, useRef } from 'react';
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
const PAGE_SIZE = 20;

export default function HomeScreen({ navigation }) {
    const [posts, setPosts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const { user } = useAuth();
    const currentPage = useRef(0);
    const allPosts = useRef([]);

    const fetchPosts = async (pageNum = 0, replace = true) => {
        try {
            const res = await getAllPosts(pageNum, PAGE_SIZE);
            const data = res.data;

            // Handle both paginated and non-paginated responses
            const newPosts = data.content || data;
            const more = data.hasMore ?? false;

            if (replace) {
                allPosts.current = newPosts;
                setPosts(newPosts);
            } else {
                const combined = [...allPosts.current, ...newPosts];
                allPosts.current = combined;
                setPosts(combined);
            }

            setHasMore(more);
            currentPage.current = pageNum;
            applyFilters(replace ? newPosts : allPosts.current, activeCategory, search);
        } catch (e) {
            console.log('Fetch posts error:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchPosts(0, true);
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
        applyFilters(allPosts.current, cat, search);
    };

    const handleSearchChange = (text) => {
        setSearch(text);
        applyFilters(allPosts.current, activeCategory, text);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        currentPage.current = 0;
        fetchPosts(0, true);
    }, []);

    const onLoadMore = () => {
        if (loadingMore || !hasMore || search || activeCategory !== 'All') return;
        setLoadingMore(true);
        fetchPosts(currentPage.current + 1, false);
    };

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
                <Text style={[styles.catText, isActive && styles.catTextActive]} numberOfLines={1}>
                    {label}
                </Text>
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
                onEndReached={onLoadMore}
                onEndReachedThreshold={0.3}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No posts found</Text>
                        <Text style={styles.emptySubtext}>Pull down to refresh</Text>
                    </View>
                }
                ListFooterComponent={
                    loadingMore ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <Text style={styles.loadingMoreText}>Loading more...</Text>
                        </View>
                    ) : null
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
    categories: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 4, gap: 8 },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 30,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: COLORS.border,
        gap: 5,
    },
    catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    catIcon: { fontSize: 16 },
    catText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', flexShrink: 0 },
    catTextActive: { color: '#fff' },
    feed: { paddingTop: 4, paddingBottom: 24 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
    emptyIcon: { fontSize: 48, marginBottom: 4 },
    emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    emptySubtext: { fontSize: 14, color: COLORS.textSecondary },
    loadingMore: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    loadingMoreText: { fontSize: 13, color: COLORS.textSecondary },
});