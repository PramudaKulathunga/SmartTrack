import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, LogBox, StyleSheet, StatusBar, TouchableOpacity, Text } from 'react-native';
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
import SplashScreen from './src/screens/SplashScreen';

// Suppress the specific error message
LogBox.ignoreLogs([
  'Expected static flag was missing. Please notify the React team',
  "The action 'NAVIGATE' with payload",
]);

// Create Navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  // Filter out the Map screen from the tab bar
  const filteredRoutes = state.routes.filter(route => route.name !== 'Map');

  return (
    <View style={styles.tabBarContainer}>
      {filteredRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const tabLabel =
          route.name === 'Add' ? '' :
            route.name === 'Home' ? 'Home' :
              route.name === 'Settings' ? 'Settings' :
                route.name === 'About Us' ? 'About' : route.name;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <View style={styles.tabContent}>
              {route.name === 'Add' ? (
                <View style={styles.addButton}>
                  <Feather name="plus" size={28} color="white" />
                </View>
              ) : (
                <>
                  {options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? 'rgb(15, 164, 220)' : 'gray',
                    size: 28,
                  })}
                  <Text style={[
                    styles.tabLabel,
                    { color: isFocused ? 'rgb(15, 164, 220)' : 'gray' }
                  ]}>
                    {tabLabel}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Bottom Tab Navigator with custom tab bar
function BottomTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Map') iconName = 'map';
          else if (route.name === 'Settings') iconName = 'settings';
          else if (route.name === 'About Us') iconName = 'info';

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Add" component={AddingScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="About Us" component={AboutUsScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
    </Tab.Navigator>
  );
}

// Main App
export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    const checkFirstLaunchAndLogin = async () => {
      try {
        // Check if it's the first launch
        const isFirst = await AsyncStorage.getItem('isFirstLaunch');
        if (isFirst === null) {
          setIsFirstLaunch(true);
          await AsyncStorage.setItem('isFirstLaunch', 'false');
        } else {
          setIsFirstLaunch(false);
        }

        // Check for stored user data
        const storedUserData = await AsyncStorage.getItem('userData');
        setIsLoggedIn(!!storedUserData);
      } catch (error) {
        console.error('Error checking first launch or login status:', error);
        setIsFirstLaunch(false);
      }
    };

    checkFirstLaunchAndLogin();
  }, []);

  // Hide splash screen after animation ends
  const hideSplashScreen = () => {
    setIsSplashVisible(false);
  };

  // Render splash screen while loading
  if (isSplashVisible) {
    return (
      <>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <SplashScreen onAnimationEnd={hideSplashScreen} />
      </>
    );
  }

  // Render nothing while checking initial state
  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isFirstLaunch ? (
            <Stack.Screen
              name="Walkthrough"
              component={WalkthroughScreen}
              options={{ gestureEnabled: false }}
            />
          ) : null}

          {!isLoggedIn ? (
            <>
              <Stack.Screen name="Start" component={StartScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Login" component={SignInScreen} options={{ headerShown: false }} />
              <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Main" component={BottomTabs} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="Start" component={StartScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Login" component={SignInScreen} options={{ headerShown: false }} />
              <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Main" component={BottomTabs} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 100,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  tabContent: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: 'rgb(15, 164, 220)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});