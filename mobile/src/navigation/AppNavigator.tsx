import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { ActivityIndicator, View } from 'react-native';

import { api } from '../services/api';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DrawingScreen } from '../screens/DrawingScreen';
import { ConnectScreen } from '../screens/ConnectScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { FriendsListScreen } from '../screens/FriendsListScreen';
import { WidgetSetupGuideScreen } from '../screens/WidgetSetupGuideScreen';
import { WidgetSettingsScreen } from '../screens/WidgetSettingsScreen';
import { DrawingHistoryScreen } from '../screens/DrawingHistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS } from '../theme/theme';

const Stack = createNativeStackNavigator();

// Deep link configuration for widget tap actions
const linking = {
  prefixes: ['doodlix://', 'https://doodlix.app'],
  config: {
    screens: {
      Home: 'home',
      Drawing: 'draw/:roomId',
      Connect: 'invite/:code',
      WidgetSettings: 'settings',
    },
  },
};

export const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await api.getCurrentUser();
      if (user) {
        setInitialRoute('Home');
      } else {
        setInitialRoute('Welcome');
      }
    } catch {
      setInitialRoute('Welcome');
    }
  };

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF9FF' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Drawing"
          component={DrawingScreen}
          options={{
            animation: 'fade_from_bottom',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="Connect" component={ConnectScreen} />
        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
          options={{
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen name="FriendsList" component={FriendsListScreen} />
        <Stack.Screen name="WidgetSetupGuide" component={WidgetSetupGuideScreen} />
        <Stack.Screen name="WidgetSettings" component={WidgetSettingsScreen} />
        <Stack.Screen name="DrawingHistory" component={DrawingHistoryScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

