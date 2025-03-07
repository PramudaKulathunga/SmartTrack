import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Feather } from '@expo/vector-icons';

// Import Screens
import WalkthroughScreen from './src/screens/WalkthroughScreen/WalkthroughScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import AboutUsScreen from './src/screens/AboutScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AddingScreen from './src/screens/AddingScreen';
import StartScreen from './src/screens/Authentication/StartScreen';
import SignInScreen from './src/screens/Authentication/SignInScreen';
import SignUpScreen from './src/screens/Authentication/SignUpScreen';

// Create Navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function BottomTabs() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Add") {
            return (
              <View style={styles.addButton}>
                <Feather name="plus" size={28} color="white" />
              </View>
            );
          }

          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Map") iconName = "map";
          else if (route.name === "Settings") iconName = "settings";
          else if (route.name === "About Us") iconName = "info";

          return <MaterialIcons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: "rgb(15, 164, 220)",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Add" component={AddingScreen} options={{ tabBarLabel: "", headerShown: false }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Map" component={MapScreen}/>
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="About Us" component={AboutUsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// Main App
export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const isFirst = await AsyncStorage.getItem('isFirstLaunch');
      if (isFirst === null) {
        setIsFirstLaunch(true);
        await AsyncStorage.setItem('isFirstLaunch', 'false');
      } else {
        setIsFirstLaunch(false);
      }
    };
    checkFirstLaunch();
  }, []);

  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isFirstLaunch ? 'Walkthrough' : 'Start'}>
        <Stack.Screen name="Walkthrough" component={WalkthroughScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Start" component={StartScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={BottomTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 70,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  addButton: {
    backgroundColor: "rgb(15, 164, 220)",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff6a9e",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
