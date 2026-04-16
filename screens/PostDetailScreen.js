import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, STATUS_COLORS, STATUS_LABELS } from '../constants/theme';
import { getComments, addComment, likePost, unlikePost, getLikes, getImageUrl } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function PostDetailScreen({ route, navigation }) {
    const { post } = route.params;
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [liked, setLiked] = useState(post.likedByMe || false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);

    const categoryColor = CATEGORY_COLORS[post.category] || COLORS.textSecondary;
    const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
    const categoryIcon = CATEGORY_ICONS[post.category] || '📍';
    const statusColor = STATUS_COLORS[post.status] || COLORS.textSecondary;
    const statusLabel = STATUS_LABELS[post.status] || post.status;
    const imageUrl = getImageUrl(post.imageUrl);
    const hasImage = !!(imageUrl && typeof imageUrl === 'string' && imageUrl.length > 10 && imageUrl.startsWith('http'));

    useEffect(() => {
        fetchComments();
        fetchLikes();
    }, []);

    const fetchLikes = async () => {
        try {
            const res = await getLikes(post.id);
            setLikeCount(res.data.likeCount);
            setLiked(res.data.likedByMe);
        } catch (e) {
            console.log('Likes error:', e);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await getComments(post.id);
            setComments(res.data);
        } catch (e) {
            console.log('Comments error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!commentText.trim()) return;
        setSubmitting(true);
        try {
            const res = await addComment(post.id, commentText.trim());
            setComments([...comments, res.data]);
            setCommentText('');
        } catch (e) {
            console.log('Comment error:', e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async () => {
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
        }
    };

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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Report</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Post author */}
                    <View style={styles.authorRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {(post.username || 'U').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.username}>{post.username || 'User'}</Text>
                            <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                    </View>

                    {/* Image */}
                    {hasImage && (
                        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" onError={() => {}} />
                    )}

                    {/* Category + description */}
                    <View style={styles.body}>
                        <View style={[styles.catBadge, { backgroundColor: categoryColor + '20' }]}>
                            <Text style={[styles.catText, { color: categoryColor }]}>
                                {categoryIcon} {categoryLabel}
                            </Text>
                        </View>
                        <Text style={styles.description}>{post.description}</Text>

                        {/* Location */}
                        {(post.latitude && post.longitude) && (
                            <View style={styles.locationRow}>
                                <Text style={styles.locationIcon}>📍</Text>
                                <Text style={styles.locationText}>
                                    {parseFloat(post.latitude).toFixed(4)}, {parseFloat(post.longitude).toFixed(4)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Like — no share button */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
                            <Text style={styles.likeIcon}>👍</Text>
                            <Text style={[styles.likeCount, liked && { color: COLORS.primary }]}>
                                {likeCount} likes
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.commentCount}>{comments.length} comments</Text>
                    </View>

                    {/* Comments */}
                    <View style={styles.commentsSection}>
                        <Text style={styles.commentsTitle}>Comments</Text>
                        {loading ? (
                            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />
                        ) : comments.length === 0 ? (
                            <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                        ) : (
                            comments.map((c) => (
                                <View key={c.id} style={styles.comment}>
                                    <View style={styles.commentAvatar}>
                                        <Text style={styles.commentAvatarText}>
                                            {(c.username || 'U').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.commentBody}>
                                        <View style={styles.commentHeader}>
                                            <Text style={styles.commentUsername}>{c.username}</Text>
                                            <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                                        </View>
                                        <Text style={styles.commentContent}>{c.content}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Comment input */}
                <View style={styles.inputRow}>
                    <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>
                            {(user?.username || 'U').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Write a comment..."
                        placeholderTextColor={COLORS.textLight}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !commentText.trim() && { opacity: 0.4 }]}
                        onPress={handleSubmitComment}
                        disabled={!commentText.trim() || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.sendIcon}>➤</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: { padding: 4 },
    backIcon: { fontSize: 22, color: COLORS.primary },
    headerTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
    scroll: { paddingBottom: 16 },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
    username: { fontWeight: '600', fontSize: 15, color: COLORS.text },
    time: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '600' },
    image: { width: '100%', height: 260, backgroundColor: COLORS.border },
    body: { padding: 16, gap: 12 },
    catBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    catText: { fontSize: 13, fontWeight: '600' },
    description: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    locationIcon: { fontSize: 14 },
    locationText: { fontSize: 13, color: COLORS.textSecondary },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
        gap: 16,
    },
    likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    likeIcon: { fontSize: 18 },
    likeCount: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
    commentCount: { fontSize: 14, color: COLORS.textSecondary },
    commentsSection: { padding: 16 },
    commentsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
    noComments: { color: COLORS.textLight, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
    comment: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    commentAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    commentBody: { flex: 1 },
    commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    commentUsername: { fontWeight: '600', fontSize: 13, color: COLORS.text },
    commentTime: { fontSize: 11, color: COLORS.textLight },
    commentContent: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 10,
        backgroundColor: '#fff',
    },
    commentInput: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        fontSize: 14,
        color: COLORS.text,
        maxHeight: 80,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendIcon: { color: '#fff', fontSize: 14 },
});