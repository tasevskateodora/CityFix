import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Image, ScrollView, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/theme';
import { uploadImage, updatePost, getImageUrl } from '../api/api';

export default function EditPostScreen({ route, navigation }) {
    const { post } = route.params;

    const [description, setDescription] = useState(post.description || '');
    const [imageUri, setImageUri] = useState(null);
    const [imageUrl, setImageUrl] = useState(post.imageUrl || null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [saving, setSaving] = useState(false);

    const existingImageUrl = getImageUrl(post.imageUrl);
    const hasExistingImage = !!(existingImageUrl && existingImageUrl.startsWith('http'));

    const pickImage = async () => {
        Alert.alert('Change Photo', 'Choose an option', [
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
                        quality: 0.8,
                        allowsEditing: true,
                    });
                    if (!result.canceled && result.assets?.[0]?.uri) {
                        handleImageSelected(result.assets[0].uri);
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
                        quality: 0.8,
                        allowsEditing: true,
                    });
                    if (!result.canceled && result.assets?.[0]?.uri) {
                        handleImageSelected(result.assets[0].uri);
                    }
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleImageSelected = async (uri) => {
        setImageUri(uri);
        setUploadingImage(true);
        try {
            const url = await uploadImage(uri);
            setImageUrl(url);
        } catch (e) {
            console.log('Upload error:', e.message);
            Alert.alert('Error', 'Could not upload image. Please try again.');
            setImageUri(null);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!description.trim()) {
            Alert.alert('Required', 'Description cannot be empty.');
            return;
        }
        setSaving(true);
        try {
            await updatePost(post.id, {
                description: description.trim(),
                imageUrl: imageUrl || null,
            });
            Alert.alert('✅ Saved', 'Your report has been updated.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            console.log('Update error:', e.message);
            Alert.alert('Error', 'Could not update the report. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const previewUri = imageUri || (hasExistingImage ? existingImageUrl : null);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Report</Text>
                    <TouchableOpacity onPress={handleSave} disabled={saving}>
                        {saving ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Text style={styles.saveText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                    {/* Photo */}
                    <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
                        {uploadingImage ? (
                            <View style={styles.photoPlaceholder}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.uploadingText}>Uploading...</Text>
                            </View>
                        ) : previewUri ? (
                            <>
                                <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" onError={() => {}} />
                                <View style={styles.changePhotoOverlay}>
                                    <Text style={styles.changePhotoText}>📷 Change Photo</Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Text style={styles.photoIcon}>📷</Text>
                                <Text style={styles.photoText}>Add Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* AI note */}
                    <View style={styles.aiInfoBox}>
                        <Text style={styles.aiInfoIcon}>🤖</Text>
                        <Text style={styles.aiInfoText}>
                            If you upload a new photo, AI will automatically re-classify the category.
                        </Text>
                    </View>

                    {/* Description */}
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Description</Text>
                        <Text style={[
                            styles.charCount,
                            description.length > 480 && styles.charCountWarning,
                            description.length >= 500 && styles.charCountError,
                        ]}>
                            {description.length}/500
                        </Text>
                    </View>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe the issue..."
                        placeholderTextColor={COLORS.textLight}
                        value={description}
                        onChangeText={(text) => { if (text.length <= 500) setDescription(text); }}
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                    />

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
    scroll: { padding: 20, paddingBottom: 40 },
    photoBox: {
        height: 200,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: COLORS.background,
    },
    photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    photoIcon: { fontSize: 36 },
    photoText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
    uploadingText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8 },
    previewImage: { width: '100%', height: '100%' },
    changePhotoOverlay: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingVertical: 8,
        alignItems: 'center',
    },
    changePhotoText: { color: '#fff', fontSize: 13, fontWeight: '500' },
    aiInfoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
        padding: 12,
        gap: 10,
        marginBottom: 16,
    },
    aiInfoIcon: { fontSize: 18 },
    aiInfoText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 18 },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.text },
    charCount: { fontSize: 12, color: COLORS.textSecondary },
    charCountWarning: { color: '#F59E0B' },
    charCountError: { color: '#EF4444', fontWeight: '600' },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
});