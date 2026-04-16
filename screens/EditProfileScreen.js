import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { updateMe } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function EditProfileScreen({ navigation }) {
    const { user, refreshUser } = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Username cannot be empty');
            return;
        }
        setLoading(true);
        try {
            await updateMe({ username: username.trim() });
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
                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {(username || 'U').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.changeAvatarText}>Change Avatar</Text>
                        </TouchableOpacity>
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
    scroll: { padding: 24 },
    avatarSection: { alignItems: 'center', marginBottom: 32, gap: 12 },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 36 },
    changeAvatarText: { color: COLORS.primary, fontSize: 15, fontWeight: '500' },
    fields: { gap: 20 },
    field: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 12,
    },
    fieldLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '500' },
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