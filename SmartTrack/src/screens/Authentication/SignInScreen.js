import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Alert, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { database, get, ref } from '../../firebaseConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from '../../Component/CustomAlert';

const SignInScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    // Function to show custom alert
    const showAlert = (title, message, showConfirmButton = false, onConfirm) => {
        setAlertConfig({
            title,
            message,
            showConfirmButton,
            onConfirm,
        });
        setIsAlertVisible(true);
    };

    const handleLogin = async () => {
        Keyboard.dismiss();

        setLoading(true);
        try {
            const userRef = ref(database, `users/${email.replace(/\./g, ',')}`);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                showAlert(
                    "Account not found",
                    "Account not found using this email. Please Sign up",
                    true,
                    async () => {
                        await AsyncStorage.removeItem("userData");
                        navigation.navigate('SignUp');
                    }
                );
                return;
            }

            const userData = snapshot.val();

            if (userData.password === password) {
                const loginDate = new Date().toISOString();
                const userDataToStore = {
                    email: email,
                    password: password,
                    name: userData.name,
                    phoneNumber: userData.phoneNumber,
                    role: userData.role,
                    loginDate: loginDate,
                    devices: userData.devices || [],
                };
                await AsyncStorage.setItem('userData', JSON.stringify(userDataToStore));

                navigation.replace('Main');
            } else {
                showAlert("Error", "Incorrect password");
            }
        } catch (error) {
            console.error('Firebase Error:', error);
            showAlert("Error", "An error occurred. Please try again");
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
                    <Text style={styles.title}>SIGN IN TO YOUR ACCOUNT</Text>
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

                    <TouchableOpacity
                        style={[styles.customButton, (loading || !email || !password) && { opacity: 0.7 }]}
                        onPress={handleLogin}
                        disabled={loading || !email || !password}
                    >
                        <Text style={styles.buttonText}>{loading ? 'LOGGING IN...' : 'LOG IN'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
                        Don't have an account? Sign up
                    </Text>
                </View>
            </View>

            {/* Custom Alert */}
            <CustomAlert
                visible={isAlertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setIsAlertVisible(false)}
                onConfirm={alertConfig.onConfirm}
                showConfirmButton={alertConfig.showConfirmButton}
            />
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
        marginBottom: 10,
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

export default SignInScreen;