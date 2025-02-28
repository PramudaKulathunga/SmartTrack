import 'react-native-gesture-handler';  // Make sure this is at the top
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For checking first launch

import WalkthroughScreen from './screens/walkthroughScreen';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import AboutUsScreen from './screens/AboutScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const isFirst = await AsyncStorage.getItem('isFirstLaunch');
      if (isFirst === null) {
        setIsFirstLaunch(true); // It's the first time, show walkthrough
        await AsyncStorage.setItem('isFirstLaunch', 'false'); // Set as not first launch after this
      } else {
        setIsFirstLaunch(false); // It's not the first time
      }
    };
    checkFirstLaunch();
  }, []);

  if (isFirstLaunch === null) {
    return null; // Show nothing until we know if it's the first launch
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isFirstLaunch ? 'Walkthrough' : 'Home'}>
        <Stack.Screen name="Walkthrough" component={WalkthroughScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="About Us" component={AboutUsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}