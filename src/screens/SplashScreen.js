import React, { useEffect, useRef } from 'react';
import {
    StatusBar,
    Text,
    StyleSheet,
    Animated,
    Image,
    View,
    Platform,
} from 'react-native';
import GradientBackground from '../Component/GradientContainer';
import * as NavigationBar from 'expo-navigation-bar';
import { AppState } from 'react-native';

const SplashScreen = ({ onAnimationEnd }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    // Hide Navigation Bar
    useEffect(() => {
        const hideNavBar = async () => {
            try {
                await NavigationBar.setBehaviorAsync('immersive-sticky');
                await NavigationBar.setVisibilityAsync('hidden');
            } catch (err) {
                console.warn('NavigationBar error:', err);
            }
        };

        hideNavBar();

        // Re-apply when app resumes
        const appStateListener = AppState.addEventListener('change', state => {
            if (state === 'active') {
                hideNavBar();
            }
        });

        return () => appStateListener.remove();
    }, []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 5000,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onAnimationEnd();
        });
    }, []);

    return (
        <GradientBackground style={styles.container}>
            <StatusBar hidden={true} translucent backgroundColor="transparent" />
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Image
                    source={require('../../assets/logo_transparent.png')}
                    style={styles.logo}
                />
                <Text style={styles.appName}>Track Smarter, Rent Safer</Text>
            </Animated.View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff', // fallback in case gradient fails
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: -90,
    },
    logo: {
        width: 300,
        height: 300,
        resizeMode: 'contain',
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: -90,
        color: 'rgb(47, 11, 120)',
    },
});

export default SplashScreen;
