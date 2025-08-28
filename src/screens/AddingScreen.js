import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { database, ref, set, get } from "../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from '../Component/CustomAlert';

export default function AddingScreen({ navigation }) {
    const [newDeviceName, setNewDeviceName] = useState("");
    const [newDeviceId, setNewDeviceId] = useState("");
    const [userData, setUserData] = useState(null);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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

    // Fetch user data and devices when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const fetchUserData = async () => {
                const storedUserData = await AsyncStorage.getItem("userData");
                if (storedUserData) {
                    const parsedUserData = JSON.parse(storedUserData);
                    setUserData(parsedUserData);
                    fetchDevices(parsedUserData.email);
                }
            };
            fetchUserData();
        }, [])
    );

    // Fetch devices from Firebase
    const fetchDevices = async (email) => {
        const devicesRef = ref(database, `users/${email.replace(/\./g, ",")}/devices`);
        const snapshot = await get(devicesRef);
        if (snapshot.exists()) {
            const devices = Object.values(snapshot.val());
            setUserData((prevUserData) => ({ ...prevUserData, devices }));
        }
    };

    // Add keyboard event listeners
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardVisible(true); // Keyboard is visible
        });
        const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardVisible(false); // Keyboard is hidden
        });

        // Clean up listeners
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Function to handle adding a new device
    const handleAddDevice = async () => {
        Keyboard.dismiss();

        if (newDeviceName.trim() === "" || newDeviceId.trim() === "") {
            showAlert("Error", "Please fill in all fields.");
            return;
        }

        if (userData.role === "driver" && userData.devices?.length >= 1) {
            showAlert(
                "Device Count Exceeded",
                "Drivers can only add one device. Do you want to terminate this process?",
                true,
                async () => {
                    navigation.jumpTo("Home");
                }
            );
            return;
        }

        try {
            const newDevice = {
                id: (userData.devices?.length || 0) + 1,
                name: newDeviceName,
                deviceId: newDeviceId,
                status: "Not Hired"
            };

            const updatedDevices = userData.devices ? [...userData.devices, newDevice] : [newDevice];

            // Update Firebase
            const userRef = ref(database, `users/${userData.email.replace(/\./g, ",")}`);
            await set(ref(database, `users/${userData.email.replace(/\./g, ",")}/devices`), updatedDevices);

            // Update AsyncStorage
            const updatedUserData = { ...userData, devices: updatedDevices };
            await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));

            setNewDeviceId('');
            setNewDeviceName('');
            navigation.jumpTo("Home");
        } catch (error) {
            showAlert("Error", "An error occurred while adding the device. Please try again.");
        }
    };

    return (
        <View style={styles.backgroundContainer}>
            <ImageBackground
                source={require('../../assets/Background.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={styles.titleWrapper}>
                    <Text style={styles.title}>Add New Device</Text>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.input}
                            placeholder="Device Name"
                            placeholderTextColor="rgba(15, 164, 220, 0.7)"
                            value={newDeviceName}
                            onChangeText={setNewDeviceName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Device ID"
                            placeholderTextColor="rgba(15, 164, 220, 0.7)"
                            value={newDeviceId}
                            onChangeText={setNewDeviceId}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.submitButton} onPress={handleAddDevice}>
                                <Text style={styles.buttonText}>Add</Text>
                            </TouchableOpacity>
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
                </KeyboardAvoidingView>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    backgroundContainer: {
        flex: 1,
        position: 'relative',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 50,
    },
    titleWrapper: {
        paddingTop: 100,
        paddingBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 35,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 20
    },
    modalContent: {
        width: "100%",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    input: {
        width: "100%",
        backgroundColor: "#f1f1f1",
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#ccc",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#ccc",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginRight: 5,
    },
    submitButton: {
        flex: 1,
        backgroundColor: "rgb(67, 190, 231)",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
