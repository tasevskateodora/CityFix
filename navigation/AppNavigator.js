import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../constants/theme';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ReportScreen from '../screens/ReportScreen';
import MyReportScreen from '../screens/MyReportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const RootStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const MapStack = createStackNavigator();
const ReportStack = createStackNavigator();
const MyReportStack = createStackNavigator();
const ProfileStack = createStackNavigator();

function TabIcon({ emoji, label, focused }) {
    return (
        <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
            <Text style={{
                fontSize: 10,
                fontWeight: focused ? '600' : '400',
                color: focused ? COLORS.primary : COLORS.textLight,
            }}>
                {label}
            </Text>
        </View>
    );
}

function HomeStackScreen() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false }}>
            <HomeStack.Screen name="HomeMain" component={HomeScreen} />
            <HomeStack.Screen name="PostDetail" component={PostDetailScreen} />
        </HomeStack.Navigator>
    );
}

function MapStackScreen() {
    return (
        <MapStack.Navigator screenOptions={{ headerShown: false }}>
            <MapStack.Screen name="MapMain" component={MapScreen} />
            <MapStack.Screen name="PostDetail" component={PostDetailScreen} />
        </MapStack.Navigator>
    );
}

function ReportStackScreen() {
    return (
        <ReportStack.Navigator screenOptions={{ headerShown: false }}>
            <ReportStack.Screen name="ReportMain" component={ReportScreen} />
        </ReportStack.Navigator>
    );
}

function MyReportStackScreen() {
    return (
        <MyReportStack.Navigator screenOptions={{ headerShown: false }}>
            <MyReportStack.Screen name="MyReportMain" component={MyReportScreen} />
            <MyReportStack.Screen name="PostDetail" component={PostDetailScreen} />
        </MyReportStack.Navigator>
    );
}

function ProfileStackScreen() {
    return (
        <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
            <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
            <ProfileStack.Screen name="PostDetail" component={PostDetailScreen} />
            <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
        </ProfileStack.Navigator>
    );
}

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    height: 72,
                    paddingBottom: 12,
                    paddingTop: 8,
                    borderTopColor: COLORS.border,
                    backgroundColor: '#fff',
                },
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeStackScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="🏠" label="Home" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Map"
                component={MapStackScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="🗺️" label="Map" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Report"
                component={ReportStackScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="📋" label="Report" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="MyReport"
                component={MyReportStackScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="📄" label="My Report" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStackScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="👤" label="Profile" focused={focused} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                <RootStack.Screen name="Splash" component={SplashScreen} />
                <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
                <RootStack.Screen name="Login" component={LoginScreen} />
                <RootStack.Screen name="MainTabs" component={MainTabs} />
            </RootStack.Navigator>
        </NavigationContainer>
    );
}