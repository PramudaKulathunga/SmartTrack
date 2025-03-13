import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";

const CustomAlert = ({
    visible,
    title,
    message,
    onClose,
    onConfirm,
    showConfirmButton = false, // Default to single-button alert
}) => {
    return (
        <Modal visible={visible} transparent={true} animationType="fade">
            <View style={styles.alertOverlay}>
                <View style={styles.alertBox}>
                    <Text style={styles.alertTitle}>{title}</Text>
                    <Text style={styles.alertMessage}>{message}</Text>
                    <View style={[styles.alertButtons, { justifyContent: showConfirmButton ? "space-between" : "center" }]}>
                        {showConfirmButton ? (
                            <>
                                <TouchableOpacity style={[styles.alertButton, styles.cancelButton]} onPress={onClose}>
                                    <Text style={styles.alertButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.alertButton, styles.confirmButton]} onPress={onConfirm}>
                                    <Text style={styles.alertButtonText}>Confirm</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity style={[styles.alertButton, styles.singleButton]} onPress={onClose}>
                                <Text style={styles.alertButtonText}>OK</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    alertOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    alertBox: {
        width: "80%",
        backgroundColor: "rgb(219, 240, 248)",
        borderRadius: 15,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
        color: "#333",
    },
    alertMessage: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
        color: "#666",
    },
    alertButtons: {
        flexDirection: "row",
    },
    alertButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        flex: 1,
        marginHorizontal: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    cancelButton: {
        backgroundColor: "rgb(74, 85, 89)",
    },
    confirmButton: {
        backgroundColor: "rgb(78, 188, 227)",
    },
    singleButton: {
        backgroundColor: "rgb(78, 188, 227)",
        width: "50%",
    },
    alertButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
}); 

export default CustomAlert;