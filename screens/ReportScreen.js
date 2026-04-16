import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Image, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS } from '../constants/theme';
import { uploadImage, createPost, reverseGeocode } from '../api/api';

export default function ReportScreen({ navigation }) {
    const [description, setDescription] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [location, setLocation] = useState(null);
    const [locationAddress, setLocationAddress] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [classifying, setClassifying] = useState(false);

    useEffect(() => {
        getLocation();
    }, []);

    const getLocation = async () => {
        setLoadingLocation(true);
        try {
            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission denied',
                    'Location access is needed to tag your report. Please enable it in Settings.'
                );
                setLoadingLocation(false);
                return;
            }

            // Try high accuracy first, fall back to balanced
            let loc;
            try {
                loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 5000,
                    distanceInterval: 0,
                });
            } catch (e) {
                // fallback to last known location
                loc = await Location.getLastKnownPositionAsync();
            }

            if (!loc) {
                setLocationAddress('Could not get location');
                return;
            }

            setLocation(loc.coords);

            // Reverse geocode via backend
            try {
                const res = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
                setLocationAddress(res.data.address || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
            } catch (e) {
                setLocationAddress(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
            }
        } catch (e) {
            console.log('Location error:', e.message);
            setLocationAddress('Could not get location. Tap to retry.');
        } finally {
            setLoadingLocation(false);
        }
    };

    const pickImage = async () => {
        Alert.alert('Add Photo', 'Choose an option', [
            {
                text: 'Camera',
                onPress: async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission needed', 'Please enable camera access in your device Settings.');
                        return;
                    }
                    try {
                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ['images'],
                            quality: 0.8,
                            allowsEditing: true,
                        });
                        if (!result.canceled && result.assets?.[0]?.uri) {
                            handleImageSelected(result.assets[0].uri);
                        }
                    } catch (e) {
                        console.log('Camera error:', e.message);
                        Alert.alert('Error', 'Could not open camera. Please try gallery instead.');
                    }
                },
            },
            {
                text: 'Gallery',
                onPress: async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission needed', 'Please enable photo library access in your device Settings.');
                        return;
                    }
                    try {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            quality: 0.8,
                            allowsEditing: true,
                        });
                        if (!result.canceled && result.assets?.[0]?.uri) {
                            handleImageSelected(result.assets[0].uri);
                        }
                    } catch (e) {
                        console.log('Gallery error:', e.message);
                        Alert.alert('Error', 'Could not open gallery.');
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
            // Show user that AI will classify automatically
            setClassifying(true);
            setTimeout(() => setClassifying(false), 1500);
        } catch (e) {
            console.log('Upload error:', e.message);
            Alert.alert('Upload failed', 'Could not upload image. Please try again.');
            setImageUri(null);
            setImageUrl(null);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert('Required', 'Please add a description');
            return;
        }
        if (!imageUrl) {
            Alert.alert(
                'Photo recommended',
                'No photo attached. Submit without a photo?',
                [
                    { text: 'Add Photo', style: 'cancel', onPress: pickImage },
                    { text: 'Submit anyway', onPress: submitPost },
                ]
            );
            return;
        }
        submitPost();
    };

    const submitPost = async () => {
        setSubmitting(true);
        try {
            await createPost({
                description: description.trim(),
                imageUrl: imageUrl || null,
                // No category — backend AI classifies automatically from the image
                latitude: location?.latitude ?? null,
                longitude: location?.longitude ?? null,
            });

            Alert.alert('Success! 🎉', 'Your report has been submitted. AI will classify it automatically.', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Reset form
                        setDescription('');
                        setImageUri(null);
                        setImageUrl(null);
                        // Navigate to MyReport tab so user sees it immediately
                        navigation.navigate('MyReport', { screen: 'MyReportMain' });
                    },
                },
            ]);
        } catch (e) {
            console.log('Submit error:', e.response?.data || e.message);
            Alert.alert('Error', 'Failed to submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Report</Text>
                    <Text style={styles.headerSubtitle}>AI auto-classifies your photo</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                    {/* Photo picker */}
                    <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
                        {uploadingImage ? (
                            <View style={styles.photoPlaceholder}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.uploadingText}>Uploading...</Text>
                            </View>
                        ) : imageUri ? (
                            <>
                                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                                {classifying && (
                                    <View style={styles.classifyingOverlay}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={styles.classifyingText}>AI classifying...</Text>
                                    </View>
                                )}
                                <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
                                    <Text style={styles.changePhotoText}>Change Photo</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Text style={styles.photoIcon}>📷</Text>
                                <Text style={styles.photoText}>Add Photo</Text>
                                <Text style={styles.photoSubtext}>AI will auto-detect the category</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.photoHint}>
                        Photos increase credibility and help city staff assess urgency.
                    </Text>

                    {/* AI classification info */}
                    <View style={styles.aiInfoBox}>
                        <Text style={styles.aiInfoIcon}>🤖</Text>
                        <Text style={styles.aiInfoText}>
                            Category is automatically detected from your photo using AI. No need to select one manually.
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.label}>Add Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Briefly describe the issue..."
                        placeholderTextColor={COLORS.textLight}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                    />

                    {/* Location */}
                    <Text style={styles.label}>Location</Text>
                    <TouchableOpacity style={styles.locationBox} onPress={getLocation}>
                        <Text style={styles.locationIcon}>📍</Text>
                        <Text style={styles.locationText} numberOfLines={2}>
                            {loadingLocation
                                ? 'Getting your location...'
                                : locationAddress || 'Tap to get location'}
                        </Text>
                        {loadingLocation
                            ? <ActivityIndicator size="small" color={COLORS.primary} />
                            : <Text style={styles.refreshIcon}>🔄</Text>
                        }
                    </TouchableOpacity>

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <View style={styles.submitLoading}>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.submitText}>Submitting...</Text>
                            </View>
                        ) : (
                            <Text style={styles.submitText}>Submit Report</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    headerSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    scroll: { padding: 20, paddingBottom: 40 },
    photoBox: {
        height: 200,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        overflow: 'hidden',
        marginBottom: 8,
        backgroundColor: COLORS.background,
    },
    photoPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    photoIcon: { fontSize: 40 },
    photoText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
    photoSubtext: { fontSize: 12, color: COLORS.textSecondary },
    uploadingText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8 },
    previewImage: { width: '100%', height: '100%' },
    classifyingOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(37,99,235,0.85)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    classifyingText: { color: '#fff', fontSize: 13, fontWeight: '500' },
    changePhotoBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    changePhotoText: { color: '#fff', fontSize: 12, fontWeight: '500' },
    photoHint: { fontSize: 12, color: COLORS.textLight, marginBottom: 12 },
    aiInfoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
        padding: 12,
        gap: 10,
        marginBottom: 16,
    },
    aiInfoIcon: { fontSize: 20 },
    aiInfoText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 18 },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 6,
        marginTop: 4,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
    },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    locationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 8,
        marginBottom: 20,
    },
    locationIcon: { fontSize: 16 },
    locationText: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
    refreshIcon: { fontSize: 14 },
    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});