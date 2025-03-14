import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, ImageBackground, Keyboard } from "react-native";
import { Card } from "react-native-paper";
import { database, ref, set, get } from '../firebaseConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../Component/CustomAlert';
import { useFocusEffect } from "@react-navigation/native";

const HomeScreen = ({ navigation }) => {

    // Modal & Input State
    const [devices, setDevices] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState("");
    const [newDeviceId, setNewDeviceId] = useState("");
    const [userData, setUserData] = useState(null);
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

    const fetchDevices = async (email) => {
        const devicesRef = ref(database, `users/${email.replace(/\./g, ',')}/devices`);
        const snapshot = await get(devicesRef);
        if (snapshot.exists()) {
            setDevices(Object.values(snapshot.val()));
        }
    };

    const addDevice = async () => {
        Keyboard.dismiss();

        if (newDeviceName.trim() === "" || newDeviceId.trim() === "") return;

        if (userData.role === 'driver' && devices.length >= 1) {
            showAlert("Error", "Drivers can only add one device.");
            setModalVisible(false)
            return;
        }

        const newDevice = {
            id: (devices.length + 1).toString(),
            name: newDeviceName,
            deviceId: newDeviceId,
        };

        const updatedDevices = [...devices, newDevice];
        setDevices(updatedDevices);

        const userRef = ref(database, `users/${userData.email.replace(/\./g, ',')}`);
        await set(ref(database, `users/${userData.email.replace(/\./g, ',')}/devices`), updatedDevices);

        await AsyncStorage.setItem('userData', JSON.stringify({ ...userData, devices: updatedDevices }));

        setNewDeviceName("");
        setNewDeviceId("");
        setModalVisible(false);
    };

    const removeDevice = async (deviceId) => {
        showAlert(
            "Delete Device",
            "Are you sure you want to delete device?",
            true,
            async () => {
                const updatedDevices = devices.filter(device => device.deviceId !== deviceId);
                setDevices(updatedDevices);

                const userRef = ref(database, `users/${userData.email.replace(/\./g, ',')}`);
                await set(ref(database, `users/${userData.email.replace(/\./g, ',')}/devices`), updatedDevices);

                await AsyncStorage.setItem('userData', JSON.stringify({ ...userData, devices: updatedDevices }));
                setIsAlertVisible(false)
            }
        );
    };

    return (
        <ImageBackground
            source={require('../../assets/Background.png')}
            style={styles.background}
        >

            <View style={styles.titleContainer}>
                <Text style={styles.title}>SmartTrack</Text>
            </View>
            <View style={{ marginTop: 80 }} />

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.buttonContainer}>
                    {devices.length === 0 ? (
                        <View style={styles.placeholderContainer}>
                            <Text style={styles.placeholderText}>No devices added yet.</Text>
                        </View>
                    ) : (

                        <FlatList
                            data={devices}
                            keyExtractor={(item) => item.deviceId}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <Card style={styles.card}>
                                    <TouchableOpacity style={styles.cardContent} onPress={() => navigation.navigate('Map', { deviceId: item.deviceId, userRole: userData.role })}>
                                        <View style={styles.cardContent}>
                                            <Image source={require("../../assets/gps.png")} style={styles.image} />
                                            <View>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemPrice}>ID: {item.deviceId}</Text>
                                            </View>
                                        </View>
                                        <View>
                                            <TouchableOpacity onPress={() => removeDevice(item.deviceId)} style={styles.trash}>
                                                <Ionicons name="trash" size={25} color="red" />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                </Card>
                            )}
                        />
                    )}
                </View>

                <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                    <Text style={styles.addButtonText}>Add New Device</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Modal for Adding Device */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Device</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Device Name"
                            value={newDeviceName}
                            onChangeText={setNewDeviceName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Device ID"
                            value={newDeviceId}
                            onChangeText={setNewDeviceId}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitButton} onPress={addDevice}>
                                <Text style={styles.buttonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
                visible={isAlertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setIsAlertVisible(false)}
                onConfirm={alertConfig.onConfirm}
                showConfirmButton={alertConfig.showConfirmButton}
            />
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
    },
    titleContainer: {
        marginTop: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 50,
        color: '#fff',
        fontWeight: 'bold',
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 150
    },
    buttonContainer: {
        width: "100%",
    },
    placeholderContainer: {
        height: 150,
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderText: {
        fontSize: 16,
        color: "gray",
    },
    card: {
        marginBottom: 10,
        padding: 10,
        borderRadius: 10,
        backgroundColor: "#f9f9f9",
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        width: '95%',
        alignSelf: 'center',
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'space-between'
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 10,
        marginRight: 20,
        marginLeft: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "bold",
    },
    itemPrice: {
        fontSize: 14,
        color: "rgb(67, 190, 231)",
    },
    trash: {
        marginRight: 20
    },
    addButton: {
        backgroundColor: "rgb(67, 190, 231)",
        padding: 12,
        borderRadius: 5,
        alignItems: "center",
        width: "100%",
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        width: '95%',
        alignSelf: 'center',
    },
    addButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
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
        backgroundColor: "rgb(109, 125, 132)",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginRight: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 5,
    },
    submitButton: {
        flex: 1,
        backgroundColor: "rgb(78, 188, 227)",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginLeft: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 5,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default HomeScreen;
