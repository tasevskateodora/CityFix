import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
} from 'react-native';
import { COLORS, CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from '../constants/theme';
import { likePost, unlikePost } from '../api/api';
import { getImageUrl } from '../api/api';

export default function PostCard({ post, onPress, currentUserId }) {
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [liked, setLiked] = useState(post.likedByMe || false);
    const [likeLoading, setLikeLoading] = useState(false);

    const categoryColor = CATEGORY_COLORS[post.category] || COLORS.textSecondary;
    const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
    const categoryIcon = CATEGORY_ICONS[post.category] || '📍';

    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    const handleLike = async () => {
        if (likeLoading) return;
        setLikeLoading(true);
        try {
            if (liked) {
                await unlikePost(post.id);
                setLikeCount((c) => c - 1);
                setLiked(false);
            } else {
                await likePost(post.id);
                setLikeCount((c) => c + 1);
                setLiked(true);
            }
        } catch (e) {
            console.log('Like error:', e);
        } finally {
            setLikeLoading(false);
        }
    };

    const imageUrl = getImageUrl(post.imageUrl);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(post.username || 'U').charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.username}>{post.username || 'User'}</Text>
                    <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                    <Text style={[styles.categoryText, { color: categoryColor }]}>
                        {categoryIcon} {categoryLabel}
                    </Text>
                </View>
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={3}>
                {post.description}
            </Text>

            {/* Image */}
            {imageUrl && (
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                />
            )}

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                    <Text style={styles.actionIcon}>{liked ? '👍' : '👍'}</Text>
                    <Text style={[styles.actionText, liked && { color: COLORS.primary }]}>
                        {likeCount}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionText}>{post.commentCount || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionIcon}>↗️</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    headerInfo: { flex: 1 },
    username: { fontWeight: '600', fontSize: 14, color: COLORS.text },
    time: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    categoryText: { fontSize: 12, fontWeight: '600' },
    description: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: 12 },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: COLORS.border,
    },
    actions: { flexDirection: 'row', gap: 16 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionIcon: { fontSize: 16 },
    actionText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
});