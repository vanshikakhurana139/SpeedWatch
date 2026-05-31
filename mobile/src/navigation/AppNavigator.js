import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '../theme';
import { useAuthStore } from '../store/authStore';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { VehicleSelectionScreen } from '../screens/VehicleSelectionScreen';
import { ActiveTripScreen } from '../screens/ActiveTripScreen';
import { TrainingScreen } from '../screens/TrainingScreen';
const Stack = createStackNavigator();

export const AppNavigator = () => {
    const { isAuthenticated, checkAuth } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const initialize = async () => {
            await checkAuth();
            setLoading(false);
        };

        initialize();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.status.safe} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: Colors.background.primary },
                }}
            >
                {!isAuthenticated ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    <>
                        <Stack.Screen name="VehicleSelection" component={VehicleSelectionScreen} />
                        <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
                        <Stack.Screen name="Training" component={TrainingScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});