import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { database, get, ref, set } from '../../firebaseConfig';

const SignUpScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        setLoading(true);

        try {
            const userRef = ref(database, `users/${email.replace(/\./g, ',')}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                Alert.alert('Error', 'Account already exists. Please login.');
                navigation.navigate('Login');
                return;
            }

            await set(userRef, {
                email: email,
                password: password,
                createdAt: new Date().toISOString(),
            });

            Alert.alert('Success', 'Account created successfully!');
            navigation.navigate('Login');
        } catch (error) {
            console.error('Firebase Error:', error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../../assets/Background.png')}
            style={styles.background}
        >
            <View style={styles.container}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>CREATE YOUR ACCOUNT</Text>
                </View>
                <View style={styles.buttonContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.iconButton}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off' : 'eye'}
                                size={23}
                                color="rgb(15, 164, 220)"
                                style={{ marginBottom: 5 }}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.passwordContainer, { marginBottom: 10 }]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.iconButton}
                        >
                            <Ionicons
                                name={showConfirmPassword ? 'eye-off' : 'eye'}
                                size={23}
                                color="rgb(15, 164, 220)"
                                style={{ marginBottom: 5 }}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.customButton, (loading || !email || !password || !confirmPassword) && { opacity: 0.7 }]}
                        onPress={handleSignUp}
                        disabled={loading || !email || !password || !confirmPassword}
                    >
                        <Text style={styles.buttonText}>{loading ? 'SIGNING UP...' : 'SIGN UP'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.link} onPress={() => navigation.replace('Login')}>
                        Already have an account? Sign in
                    </Text>
                </View>
            </View>
        </ImageBackground >
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 35,
        color: '#fff',
        fontWeight: 'bold',
    },
    buttonContainer: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        width: '75%'
    },
    input: {
        width: '100%',
        padding: 15,
        paddingLeft: 20,
        marginBottom: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgb(15, 164, 220)',
        color: 'rgb(15, 164, 220)',
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    iconButton: {
        position: 'absolute',
        right: 10,
        padding: 10,
    },
    customButton: {
        backgroundColor: "rgb(15, 164, 220)",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    link: {
        color: 'blue',
        marginTop: 15,
        fontSize: 15,
    },
});

export default SignUpScreen;