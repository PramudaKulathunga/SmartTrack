import React, { useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, ImageBackground } from "react-native";
import { Card } from "react-native-paper";

const HomeScreen = () => {
    // State for devices list
    const [devices, setDevices] = useState([
        { id: "1", name: "Device 01", deviceId: "ffsdfdsf", image: require("../../assets/gps.png") },
        { id: "2", name: "Device 02", deviceId: "jhghhf", image: require("../../assets/gps.png") },
        { id: "3", name: "Device 03", deviceId: "rwewtgf", image: require("../../assets/gps.png") },
        { id: "4", name: "Device 04", deviceId: "mhgdxfdf", image: require("../../assets/gps.png") },
    ]);

    // Modal & Input State
    const [modalVisible, setModalVisible] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState("");
    const [newDeviceId, setNewDeviceId] = useState("");

    // Function to add a new device
    const addDevice = () => {
        if (newDeviceName.trim() === "" || newDeviceId.trim() === "") return;

        const newDevice = {
            id: (devices.length + 1).toString(),
            name: newDeviceName,
            deviceId: newDeviceId,
            image: require("../../assets/gps.png"),
        };

        setDevices([...devices, newDevice]);
        setNewDeviceName("");
        setNewDeviceId("");
        setModalVisible(false);
    };

    return (
        <ImageBackground
            source={require('../../assets/Background.png')}
            style={styles.background}
        >
            {/* <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            > */}
                {/* Devices List */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>SmartTrack</Text>
                </View>

                <View style={{ marginTop: 80 }} />
                <View style={styles.buttonContainer}>
                    <FlatList
                        data={devices}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <Card style={styles.card}>
                                <TouchableOpacity style={styles.cardContent}>
                                    <Image source={item.image} style={styles.image} />
                                    <View>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemPrice}>ID: {item.deviceId}</Text>
                                    </View>
                                </TouchableOpacity>
                            </Card>
                        )}

                    />

                    <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                        <Text style={styles.addButtonText}>Add New Device</Text>
                    </TouchableOpacity>


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
                </View>
            {/* </ScrollView> */}
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
        padding: 16,
        paddingBottom: 150
    },
    titleContainer: {
        marginTop:80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 50,
        color: '#fff',
        fontWeight: 'bold',
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 150
    },
    card: {
        marginBottom: 10,
        padding: 10,
        borderRadius: 10,
        backgroundColor: "#f9f9f9",
        elevation: 2,
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 10,
        marginRight: 15,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "bold",
    },
    itemPrice: {
        fontSize: 14,
        color: "rgb(67, 190, 231)",
    },
    addButton: {
        backgroundColor: "rgb(67, 190, 231)",
        padding: 12,
        borderRadius: 5,
        alignItems: "center",
        width: "100%",
        marginTop: 15,
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
        marginLeft: 5,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default HomeScreen;
