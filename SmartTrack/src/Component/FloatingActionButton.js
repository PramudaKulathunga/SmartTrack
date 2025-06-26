import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Animated, TouchableWithoutFeedback } from "react-native";
import { FAB } from "react-native-paper";
import { database, ref, update, get } from '../firebaseConfig';
import CustomAlert from '../Component/CustomAlert';
import { Ionicons } from '@expo/vector-icons';

const FloatingActionButton = ({ userRole, deviceId }) => {
    const [open, setOpen] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const fadeAnim = useState(new Animated.Value(0))[0];

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

    // Handle FAB open/close with animation
    const toggleFAB = () => {
        setOpen(!open);
        Animated.timing(fadeAnim, {
            toValue: open ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    // Close FAB when pressing outside
    const handlePressOutside = () => {
        if (open) {
            setOpen(false);
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleAlarmPress = async () => {
        if (!deviceId) return;

        const deviceRef = ref(database, `devices/${deviceId}`);
        await update(deviceRef, {
            AlarmActivate: 1,
        }).catch((error) => {
            console.error("Firebase Update Error:", error);
        });
        toggleFAB();
    };

    const handleCallPress = async () => {
        if (!deviceId) return;

        const deviceRef = ref(database, `devices/${deviceId}`);
        await update(deviceRef, {
            CallActivate: 1,
        }).catch((error) => {
            console.error("Firebase Update Error:", error);
        });
        toggleFAB();
    };

    const handleTemperaturePress = async () => {
        if (!deviceId) {
            console.error("Device ID is missing.");
            return;
        }

        try {
            const deviceRef = ref(database, `devices/${deviceId}`);
            const snapshot = await get(deviceRef);

            if (snapshot.exists()) {
                const temperature = snapshot.val().Temperature;
                if (temperature !== undefined) {
                    showAlert("Temperature", `The current vehicle temperature is ${temperature}°C.`);
                } else {
                    showAlert("Error", "Temperature data not available.");
                }
            } else {
                showAlert("Error", "Device data not found.");
            }
        } catch (error) {
            showAlert("Error", "Failed to fetch temperature data.");
        }
        toggleFAB();
    };

    const handleSpeedPress = async () => {
        if (!deviceId) {
            console.error("Device ID is missing.");
            return;
        }

        try {
            const deviceRef = ref(database, `devices/${deviceId}`);
            const snapshot = await get(deviceRef);

            if (snapshot.exists()) {
                const speed = snapshot.val().Speed;
                if (speed !== undefined) {
                    showAlert("Speed", `The current vehicle speed is ${speed} km/h.`);
                } else {
                    showAlert("Error", "Speed data not available.");
                }
            } else {
                showAlert("Error", "Device data not found.");
            }
        } catch (error) {
            showAlert("Error", "Failed to fetch speed data.");
        }
        toggleFAB();
    };

    const handleHumidityPress = async () => {
        if (!deviceId) {
            console.error("Device ID is missing.");
            return;
        }

        try {
            const deviceRef = ref(database, `devices/${deviceId}`);
            const snapshot = await get(deviceRef);

            if (snapshot.exists()) {
                const humidity = snapshot.val().Humidity;
                if (humidity !== undefined) {
                    showAlert("Humidity", `The current vehicle humidity is ${humidity} %`);
                } else {
                    showAlert("Error", "Humidity data not available.");
                }
            } else {
                showAlert("Error", "Device data not found.");
            }
        } catch (error) {
            showAlert("Error", "Failed to fetch humidity data.");
        }
        toggleFAB();
    };

    // Define actions based on the user role
    const driverActions = [
        {
            icon: "alarm",
            label: "Alarm",
            onPress: () => handleAlarmPress(),
            color: "#FF6347",
        },
        {
            icon: "call",
            label: "Emergency Call",
            onPress: () => handleCallPress(),
            color: "#FF0000",
        },
        {
            icon: "thermometer",
            label: "Temperature",
            onPress: () => handleTemperaturePress(),
            color: "#00BFFF",
        },
        {
            icon: "water",
            label: "Humidity",
            onPress: () => handleHumidityPress(),
            color: "#00BFFF",
        },
    ];

    const ownerActions = [
        {
            icon: "alarm",
            label: "Alarm",
            onPress: () => handleAlarmPress(),
            color: "#FF6347",
        },
        {
            icon: "speedometer",
            label: "Speed",
            onPress: () => handleSpeedPress(),
            color: "#32CD32",
        },
        {
            icon: "thermometer",
            label: "Temperature",
            onPress: () => handleTemperaturePress(),
            color: "#00BFFF",
        },
        {
            icon: "water",
            label: "Humidity",
            onPress: () => handleHumidityPress(),
            color: "#00BFFF",
        },
    ];

    // Select actions based on the role
    const actions = userRole === "driver" ? driverActions : ownerActions;

    return (
        <TouchableWithoutFeedback onPress={handlePressOutside}>
            <View style={styles.container}>
                {open && <View style={styles.backdrop} />}

                {/* FAB Actions */}
                <Animated.View
                    style={[
                        styles.actionsContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    {actions.map((action, index) => (
                        <View key={index} style={{ flexDirection: 'row', justifyContent: 'flex-end', width: 300, alignContent: 'center' }}>
                            <Text style={styles.actionLabel}>{action.label}</Text>
                            <TouchableOpacity
                                key={index}
                                style={[styles.actionButton, { backgroundColor: action.color }]}
                                onPress={action.onPress}
                            >
                                <Ionicons name={action.icon} size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </Animated.View>

                {/* Main FAB */}
                <FAB
                    style={styles.fab}
                    icon={open ? "lightbulb-on" : "lightbulb-outline"}
                    onPress={toggleFAB}
                    color="#FFF"
                />

                {/* Custom Alert */}
                <CustomAlert
                    visible={isAlertVisible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={() => setIsAlertVisible(false)}
                    onConfirm={alertConfig.onConfirm}
                    showConfirmButton={alertConfig.showConfirmButton}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: -40,
        right: 20,
        zIndex: 150,
    },
    fab: {
        backgroundColor: "rgb(15, 164, 220)",
        zIndex: 150
    },
    backdrop: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        position: "absolute",
        top: -1000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        zIndex: 140,
    },
    actionsContainer: {
        position: "absolute",
        bottom: 70,
        right: 0,
        zIndex: 150,
        backgroundColor: "transparent",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 25,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    actionLabel: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
        marginTop: 10
    },
});

export default FloatingActionButton;
