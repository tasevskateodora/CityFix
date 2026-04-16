import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/theme';
import { updateMe, uploadImage, getImageUrl } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function EditProfileScreen({ navigation }) {
    const { user, refreshUser } = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [avatarLetter, setAvatarLetter] = useState(
        (user?.username || 'U').charAt(0).toUpperCase()
    );
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [newAvatarUrl, setNewAvatarUrl] = useState(user?.avatarUrl || null);

    const handlePickAvatar = async () => {
        Alert.alert('Change Avatar', 'Choose an option', [
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
                        await handleUploadAvatar(result.assets[0].uri);
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
                        await handleUploadAvatar(result.assets[0].uri);
                    }
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleUploadAvatar = async (uri) => {
        setUploadingAvatar(true);
        try {
            const url = await uploadImage(uri);
            setNewAvatarUrl(url);
            Alert.alert('✅', 'Avatar uploaded! Save your profile to apply it.');
        } catch (e) {
            console.log('Avatar upload error:', e.message);
            Alert.alert('Error', 'Could not upload avatar. Please try again.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Username cannot be empty');
            return;
        }
        setLoading(true);
        try {
            await updateMe({
                username: username.trim(),
                avatarUrl: newAvatarUrl || null,
            });
            await refreshUser();
            Alert.alert('Success', 'Profile updated!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            const msg = e.response?.data?.message || 'Failed to update profile';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const displayLetter = username.charAt(0).toUpperCase() || 'U';
    const currentAvatarUrl = getImageUrl(newAvatarUrl || user?.avatarUrl);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Text style={styles.saveText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Avatar picker */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
                            <View style={styles.avatar}>
                                {uploadingAvatar ? (
                                    <ActivityIndicator color="#fff" />
                                ) : currentAvatarUrl ? (
                                    <Image
                                        source={{ uri: currentAvatarUrl }}
                                        style={styles.avatarImage}
                                        onError={() => {}}
                                    />
                                ) : (
                                    <Text style={styles.avatarText}>{displayLetter}</Text>
                                )}
                            </View>
                            <View style={styles.cameraOverlay}>
                                <Text style={styles.cameraIcon}>📷</Text>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.changeAvatarText}>
                            {uploadingAvatar ? 'Uploading...' : 'Tap to change avatar'}
                        </Text>
                        {newAvatarUrl && newAvatarUrl !== user?.avatarUrl && (
                            <Text style={styles.avatarReady}>✅ New avatar ready — tap Save</Text>
                        )}
                    </View>

                    {/* Fields */}
                    <View style={styles.fields}>
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Username</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                placeholderTextColor={COLORS.textLight}
                            />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Email</Text>
                            <Text style={styles.fieldValueDisabled}>{user?.email}</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    cancelText: { fontSize: 16, color: COLORS.textSecondary },
    headerTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
    saveText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
    scroll: { padding: 24, alignItems: 'center' },
    avatarSection: { alignItems: 'center', marginBottom: 36 },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 40 },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    cameraIcon: { fontSize: 14 },
    changeAvatarText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '500',
        marginTop: 12,
    },
    avatarReady: {
        color: COLORS.success,
        fontSize: 13,
        marginTop: 6,
    },
    fields: { width: '100%', gap: 20 },
    field: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 12,
    },
    fieldLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 6,
        fontWeight: '500',
    },
    fieldInput: {
        fontSize: 16,
        color: COLORS.text,
        paddingVertical: 4,
    },
    fieldValueDisabled: {
        fontSize: 16,
        color: COLORS.textLight,
        paddingVertical: 4,
    },
});