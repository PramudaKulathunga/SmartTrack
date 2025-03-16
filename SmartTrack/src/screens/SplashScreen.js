import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import GradientBackground from '../Component/GradientContainer';

const SplashScreen = ({ onAnimationEnd }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Start the animation
        Animated.parallel([
            // Fade-in animation
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 5000,
                useNativeDriver: true,
            }),
            // Scale animation
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
    },
    logoContainer: {
        alignItems: 'center',
        marginTop:-90
    },
    logo: {
        width: 300,
        height: 300,
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: -90,
        color: 'rgb(47, 11, 120)',
    },
});

export default SplashScreen;