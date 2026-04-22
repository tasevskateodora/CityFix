import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
    COLORS, CATEGORY_COLORS, CATEGORY_LABELS,
    CATEGORY_ICONS, STATUS_COLORS, STATUS_LABELS,
} from '../constants/theme';
import { getPostsByUser } from '../api/api';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function MyReportScreen({ navigation }) {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);

    const fetchPosts = async () => {
        if (!user?.id) return;
        try {
            const res = await getPostsByUser(user.id);
            const sorted = res.data.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setPosts(sorted);
            setFiltered(sorted);
        } catch (e) {
            console.log('My reports error:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchPosts();
        }, [user])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPosts();
    }, [user]);

    const handleExportPdf = async () => {
        setExporting(true);
        try {
            const response = await client.get('/api/export/my-reports/pdf', {
                responseType: 'arraybuffer',
            });

            const base64 = btoa(
                new Uint8Array(response.data).reduce(
                    (data, byte) => data + String.fromCharCode(byte), ''
                )
            );

            const fileUri = FileSystem.documentDirectory + 'cityfix-reports.pdf';
            await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding: 'base64',
            });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Export My Reports',
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('Saved', 'PDF saved to: ' + fileUri);
            }
        } catch (e) {
            console.log('Export error:', e.message);
            Alert.alert('Error', 'Could not export PDF. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const renderItem = ({ item }) => {
        const catColor = CATEGORY_COLORS[item.category] || COLORS.textSecondary;
        const catLabel = CATEGORY_LABELS[item.category] || item.category || 'Other';
        const catIcon = CATEGORY_ICONS[item.category] || '📍';

        return (
            <TouchableOpacity
                style={styles.item}
                onPress={() => navigation.navigate('PostDetail', { post: item })}
                activeOpacity={0.8}
            >
                <View style={[styles.catDot, { backgroundColor: catColor + '25' }]}>
                    <Text style={styles.catDotIcon}>{catIcon}</Text>
                </View>
                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.description}
                    </Text>
                    <View style={styles.itemMeta}>
                        <Text style={[styles.itemCat, { color: catColor }]}>{catLabel}</Text>
                        <Text style={styles.dot}>·</Text>
                        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>
                <Text style={styles.chevron}>›</Text>
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
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Report</Text>
                <View style={styles.headerRight}>
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{filtered.length}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.exportBtn}
                        onPress={handleExportPdf}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Text style={styles.exportIcon}>📄</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
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
                        <Text style={styles.emptyText}>No reports yet</Text>
                        <Text style={styles.emptySubtext}>
                            Tap Report to submit your first issue
                        </Text>
                    </View>
                }
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, flex: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    countBadge: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    countBadgeText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
    exportBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },
    exportIcon: { fontSize: 18 },
    list: { paddingBottom: 24 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 14,
    },
    catDot: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
    },
    catDotIcon: { fontSize: 22 },
    itemContent: { flex: 1 },
    itemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
    itemMeta: {
        flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap',
    },
    itemCat: { fontSize: 12, fontWeight: '500' },
    dot: { color: COLORS.textLight, fontSize: 12 },
    itemDate: { fontSize: 12, color: COLORS.textLight },
    chevron: { fontSize: 22, color: COLORS.textLight },
    separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 78 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontSize: 17, fontWeight: '600', color: COLORS.text },
    emptySubtext: { fontSize: 14, color: COLORS.textSecondary },
});