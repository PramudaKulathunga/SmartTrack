import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { database, get, ref, set } from '../../firebaseConfig';
import CustomAlert from '../../Component/CustomAlert';

const SignUpScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('owner');
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    // Add keyboard event listeners
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardVisible(false);
        });

        // Clean up listeners
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Function to show custom alert
    const showAlert = (title, message, showConfirmButton = false, onConfirm) => {
        setAlertConfig({
            title,
            message,
            showConfirmButton,
            onConfirm: onConfirm ? () => {
                setIsAlertVisible(false);
                onConfirm();
            } : null,
        });
        setIsAlertVisible(true);
    };

    const handleSignUp = async () => {
        Keyboard.dismiss();

        if (password !== confirmPassword) {
            showAlert("Error", "Passwords do not match");
            return;
        }
        setLoading(true);

        try {
            const userRef = ref(database, `users/${email.replace(/\./g, ',')}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                showAlert(
                    "Account Exists",
                    "Please login! Are you like to terminate process?",
                    true,
                    async () => {
                        navigation.replace("Login");
                    }
                );
                return;
            }

            await set(userRef, {
                email: email,
                password: password,
                role: role,
                name: "Fill your name",
                phoneNumber: "Add your phone number",
                createdAt: new Date().toISOString(),
            });

            showAlert("Success", "Account created successfully!");
            navigation.navigate('Login');
        } catch (error) {
            console.error('Firebase Error:', error);
            showAlert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../../assets/Background.png')}
            style={styles.background}
        >
            <View style={[styles.container, { paddingBottom: isKeyboardVisible ? 340 : 0 }]}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>CREATE YOUR ACCOUNT</Text>
                </View>
                <View style={styles.buttonContainer}>
                    {!isKeyboardVisible &&
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={role}
                                onValueChange={(itemValue) => setRole(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Owner" value="owner" />
                                <Picker.Item label="Driver" value="driver" />
                            </Picker>
                        </View>
                    }
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
                        Already have an account? <Text style={{ fontWeight: 'bold' }}>Sign in</Text>
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
        marginHorizontal: 30
    },
    title: {
        fontSize: 35,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonContainer: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        width: '75%'
    },
    pickerContainer: {
        width: '100%',
        marginBottom: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgb(15, 164, 220)',
        overflow: 'hidden',
    },
    picker: {
        width: '100%',
        color: 'rgb(15, 164, 220)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    link: {
        color: 'rgb(15, 164, 220)',
        marginTop: 15,
        fontSize: 15,
    },
});

export default SignUpScreen;