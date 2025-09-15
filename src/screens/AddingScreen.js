import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { database, ref, set, get, push } from "../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from '../Component/CustomAlert';

export default function AddingScreen({ navigation }) {
    const [devices, setDevices] = useState([]);
    const [newDeviceName, setNewDeviceName] = useState("");
    const [newDeviceId, setNewDeviceId] = useState("");
    const [userData, setUserData] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const [isAdding, setIsAdding] = useState(false);
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
                    setUserRole(parsedUserData.role);
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

        // Set up real-time listener for devices
        const unsubscribeDevices = onValue(devicesRef, (snapshot) => {
            if (snapshot.exists()) {
                const devicesData = Object.values(snapshot.val());
                setDevices(devicesData);

                // If user is driver, set the first vehicle ID
                if (userData.role === 'driver' && devicesData.length > 0) {
                    setDeviceId(devicesData[0].deviceId);
                }
            } else {
                setDevices([]);
            }
        });

        // Clean up both listeners on unmount
        return () => {
            off(devicesRef, 'value', unsubscribeDevices);
        };
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
        if (isAdding) return;

        Keyboard.dismiss();
        setIsAdding(true);

        if (newDeviceName.trim() === "" || newDeviceId.trim() === "") {
            showAlert("Error", "Please fill all fields.");
            setIsAdding(false);
            return;
        }

        try {
            if (userData.role === 'driver' && devices.length >= 1) {
                showAlert("Error", "Drivers can only add one device.");
                setIsAdding(false);
                return;
            }

            if (userData.role === 'driver') {
                // For drivers, create a notification for the vehicle owner
                const notificationData = {
                    driverEmail: userData.email,
                    driverName: userData.name,
                    deviceId: newDeviceId,
                    deviceName: newDeviceName,
                    status: 'pending',
                    timestamp: Date.now()
                };

                // Find the vehicle owner by checking if vehicle exists in the devices node
                const deviceRef = ref(database, `devices/${newDeviceId}`);
                const deviceSnapshot = await get(deviceRef);

                if (!deviceSnapshot.exists()) {
                    showAlert("Error", "Device ID does not exist in the system.");
                    setIsAdding(false);
                    return;
                }

                // Find the owner by checking all users
                const usersRef = ref(database, 'users');
                const usersSnapshot = await get(usersRef);
                let ownerEmail = null;

                if (usersSnapshot.exists()) {
                    const users = usersSnapshot.val();
                    for (const [email, userData] of Object.entries(users)) {
                        if (userData.devices) {
                            const userDevices = Array.isArray(userData.devices) ?
                                userData.devices : Object.values(userData.devices);
                            if (userDevices.some(device => device.deviceId === newDeviceId)) {
                                ownerEmail = email.replace(/,/g, '.');
                                break;
                            }
                        }
                    }
                }

                if (ownerEmail) {
                    const ownerEmailKey = ownerEmail.replace(/\./g, ',');
                    const notificationsRef = ref(database, `notifications/${ownerEmailKey}`);
                    const newNotificationRef = push(notificationsRef);
                    await set(newNotificationRef, notificationData);

                    // Add to driver's pending devices
                    const emailKey = userData.email.replace(/\./g, ',');
                    const pendingDevicesRef = ref(database, `pendingDevices/${emailKey}`);
                    const newPendingDeviceRef = push(pendingDevicesRef);
                    await set(newPendingDeviceRef, {
                        deviceId: newDeviceId,
                        deviceName: newDeviceName,
                        status: 'pending',
                        timestamp: Date.now()
                    });

                    // Add notification for driver
                    const driverNotificationRef = ref(database, `driverNotifications/${emailKey}`);
                    const newDriverNotificationRef = push(driverNotificationRef);
                    await set(newDriverNotificationRef, {
                        type: 'request_sent',
                        deviceId: newDeviceId,
                        deviceName: newDeviceName,
                        status: 'pending',
                        timestamp: Date.now(),
                        message: `Request sent for vehicle ${newDeviceName}`
                    });

                    showAlert("Request Sent", "Your vehicle request has been sent to the owner for approval.");
                } else {
                    showAlert("Error", "Could not find the owner of this device.");
                }
            } else {
                // For owners, first check if vehicle exists in the devices node
                const deviceRef = ref(database, `devices/${newDeviceId}`);
                const deviceSnapshot = await get(deviceRef);

                if (!deviceSnapshot.exists()) {
                    showAlert("Error", "Device ID does not exist in the system. Please add the vehicle to the devices node first.");
                    setIsAdding(false);
                    return;
                }

                // Check if vehicle is already added to this user
                if (devices.some(device => device.deviceId === newDeviceId)) {
                    showAlert("Error", "This vehicle is already added to your account.");
                    setIsAdding(false);
                    return;
                }

                const newDevice = {
                    id: (devices.length + 1).toString(),
                    name: newDeviceName,
                    deviceId: newDeviceId,
                    status: "Not Hired"
                };

                const updatedDevices = [...devices, newDevice];
                const emailKey = userData.email.replace(/\./g, ',');

                // Update Firebase
                await set(ref(database, `users/${emailKey}/devices`), updatedDevices);

                // Also update AsyncStorage
                await AsyncStorage.setItem('userData', JSON.stringify({ ...userData, devices: updatedDevices }));

                showAlert("Success", "Device added successfully.");
            }

            setNewDeviceName("");
            setNewDeviceId("");
            navigation.jumpTo('Home');
        } catch (error) {
            console.error("Error adding device:", error);
            showAlert("Error", "Failed to add device. Please try again.");
        } finally {
            setIsAdding(false);
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
                                <Text style={styles.buttonText}>
                                    {userRole === 'driver' ? 'Request to Add a New Vehicle' : 'Add a New Vehicle'}
                                </Text>
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
