import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';

export default function AddingScreen({ navigation }) {
    const [newDeviceName, setNewDeviceName] = useState("");
    const [newDeviceId, setNewDeviceId] = useState("");

    return (
        <ImageBackground
            source={require('../../assets/Background.png')}
            style={styles.background}
        >
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
                    <TouchableOpacity style={styles.submitButton} onPress={() => navigation.jumpTo('Home')}>
                        <Text style={styles.buttonText}>Add</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        resizeMode: 'cover',
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 20
    },
    modalContent: {
        marginTop: 100,
        width: "100%",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 30,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 260,
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
