import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ImageBackground,
    Modal,
    TextInput
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { database, ref, set } from '../firebaseConfig';
import CustomAlert from '../Component/CustomAlert';

const defaultProfilePicture = require("../../assets/defalt_profile_picture.png");

const SettingsScreen = ({ navigation }) => {
    const [image, setImage] = useState(defaultProfilePicture);
    const [expandedSection, setExpandedSection] = useState(null);

    const [userDetails, setUserDetails] = useState({});
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [devices, setDevices] = useState({});
    const [editedName, setEditedName] = useState("");
    const [editedPhoneNumber, setEditedPhoneNumber] = useState("");
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

    // Fetch user details from AsyncStorage on component mount
    useEffect(() => {
        const fetchUserDetails = async () => {
            const storedUserData = await AsyncStorage.getItem("userData");
            if (storedUserData) {
                const userData = JSON.parse(storedUserData);
                setUserDetails(userData);
                setEditedName(userData.name || "");
                setEditedPhoneNumber(userData.phoneNumber || "");
                setDevices(userData.devices || "");

                // Retrieve the profile picture from AsyncStorage
                const profilePictureUri = await AsyncStorage.getItem(`profilePicture_${userData.email}`);
                if (profilePictureUri) {
                    setImage({ uri: profilePictureUri });
                } else {
                    setImage(defaultProfilePicture);
                }
            }
        };
        fetchUserDetails();
    }, []);

    // Function to pick an image
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            setImage({ uri: imageUri });

            // Store the image URI in AsyncStorage with the user's email as the key
            try {
                await AsyncStorage.setItem(`profilePicture_${userDetails.email}`, imageUri);
            } catch (error) {
                console.error("Error saving profile picture:", error);
            }
        }
    };

    // Function to handle expanding/collapsing sections
    const toggleSection = (section) => {
        if (expandedSection === section) {
            setExpandedSection(null);
        } else {
            setExpandedSection(section);
        }
    };

    // Function to handle saving edited details
    const handleSaveDetails = async () => {
        if (!editedName || !editedPhoneNumber) {
            showAlert("Error", "Please fill in all fields.");
            return;
        }

        const updatedUserDetails = {
            ...userDetails,
            name: editedName,
            phoneNumber: editedPhoneNumber,
        };

        // Update phone storage
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUserDetails));
        setUserDetails(updatedUserDetails);

        // Update Firebase Realtime Database
        try {
            const userRef = ref(database, `users/${userDetails.email.replace(/\./g, ',')}`);
            await set(userRef, updatedUserDetails);
            showAlert("Success", "Profile updated successfully!");
        } catch (error) {
            console.error("Firebase Error:", error);
            showAlert("Error", "Failed to update profile. Please try again.");
        }

        setIsEditModalVisible(false);
    };

    // Function to handle changing password
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showAlert("Error", "Please fill in all fields.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showAlert("Error", "New passwords do not match.");
            return;
        }

        if (currentPassword !== userDetails.password) {
            showAlert("Error", "Current password is incorrect.");
            return;
        }

        const updatedUserDetails = {
            ...userDetails,
            password: newPassword,
        };

        // Update phone storage
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUserDetails));
        setUserDetails(updatedUserDetails);

        // Update Firebase Realtime Database
        try {
            const userRef = ref(database, `users/${userDetails.email.replace(/\./g, ',')}`);
            await set(userRef, updatedUserDetails);
            showAlert("Success", "Password updated successfully!");

        } catch (error) {
            console.error("Firebase Error:", error);
            showAlert("Error", "Failed to update password. Please try again.");
        }
        setIsPasswordModalVisible(false);
    };

    // Function to handle logout
    const handleLogout = async () => {
        showAlert(
            "Log Out",
            "Are you sure you want to log out?",
            true,
            async () => {
                await AsyncStorage.removeItem("userData");
                navigation.replace("Start");
                setIsAlertVisible(false)
            }
        );
    };

    // Dummy connected devices data
    const connectedDevices = [
        { id: "1", name: "Device 01", lastActive: "2 hours ago" },
        { id: "2", name: "Device 02", lastActive: "5 days ago" },
    ];

    return (
        <ImageBackground
            source={require('../../assets/BackgroundSettings.png')}
            style={styles.background}
        >

            <View style={styles.profileSection}>
                <TouchableOpacity onPress={pickImage}>
                    <Image
                        source={image}
                        style={styles.profileImage}
                    />
                </TouchableOpacity>
                <Text style={styles.profileName}>{userDetails.name}</Text>
                <Text style={styles.profileEmail}>{userDetails.email}</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.settingsContainer}>

                    {/* Personal Info Section */}
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => toggleSection("personalInfo")}>
                        <Ionicons name="person-circle-outline" size={24} color="black" />
                        <Text style={styles.optionText}>Personal Info</Text>
                    </TouchableOpacity>

                    {/* User Details (Visible when Personal Info is expanded) */}
                    {expandedSection === "personalInfo" && (
                        <View style={styles.userDetailsContainer}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Name:</Text>
                                <Text style={styles.detailValue}>{userDetails.name || "N/A"}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Role:</Text>
                                <Text style={styles.detailValue}>{userDetails.role || "N/A"}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Email:</Text>
                                <Text style={styles.detailValue}>{userDetails.email || "N/A"}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Phone Number:</Text>
                                <Text style={styles.detailValue}>{userDetails.phoneNumber || "N/A"}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setIsEditModalVisible(true)}
                            >
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={styles.option} onPress={() => toggleSection("passwordSecurity")}>
                        <MaterialIcons name="security" size={24} color="black" />
                        <Text style={styles.optionText}>Password and Security</Text>
                    </TouchableOpacity>
                    {/* Password and Security Details (Visible when expanded) */}
                    {expandedSection === "passwordSecurity" && (
                        <View style={styles.userDetailsContainer}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Password:</Text>
                                <Text style={styles.detailValue}>
                                    {userDetails.password ? "*".repeat(userDetails.password.length) : "N/A"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setIsPasswordModalVisible(true)}
                            >
                                <Text style={styles.editButtonText}>Change Password</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Privacy Section */}
                    <TouchableOpacity style={styles.option} onPress={() => toggleSection("privacy")}>
                        <Ionicons name="lock-closed-outline" size={24} color="black" />
                        <Text style={styles.optionText}>Privacy</Text>
                    </TouchableOpacity>
                    {/* Privacy Details (Visible when expanded) */}
                    {expandedSection === "privacy" && (
                        <View style={styles.userDetailsContainer}>
                            <Text style={styles.detailLabelTitle}>Privacy Policy</Text>
                            <Text style={styles.detailLabel}>1. Collects location, speed, temperature, fire data, and emergency logs for monitoring and safety.</Text>
                            <Text style={styles.detailLabel}>2. Data is secured. only accessible to authorized users.</Text>
                            <Text style={styles.detailLabelTitle}>Terms of Service</Text>
                            <Text style={styles.detailLabel}>1. Users must be 18+ and have the right to install/use the ESP32 device.</Text>
                            <Text style={styles.detailLabel}>2. Ensure proper setup and configuration of the device.</Text>
                            <Text style={styles.detailLabel}>3. Unauthorized tracking, tampering with the ESP32 device.</Text>
                            <Text style={styles.detailLabel}>4. Owners get alerts for speed limits, fire, or abnormal conditions.</Text>
                            <Text style={styles.detailLabel}>5. Drivers can use emergency call and buzzer for genuine emergencies.</Text>
                            <Text style={styles.detailLabelTitle}>Safety and Security Policy</Text>
                            <Text style={styles.detailLabel}>1. ESP32 is hidden and tamper-resistant for theft prevention.</Text>
                            <Text style={styles.detailLabelTitle}>Cookie Policy</Text>
                            <Text style={styles.detailLabel}>1. Cookies are used for browsing experience and functionality.</Text>
                            <Text style={styles.detailLabel}>2. Users can manage cookies via application settings.</Text>
                        </View>
                    )}

                    {/* Devices Section */}
                    <TouchableOpacity style={styles.option} onPress={() => toggleSection("devices")}>
                        <Ionicons name="phone-portrait-outline" size={24} color="black" />
                        <Text style={styles.optionText}>Devices</Text>
                    </TouchableOpacity>
                    {/* Connected Devices (Visible when Devices is expanded) */}
                    {expandedSection === "devices" && (
                        <View style={styles.userDetailsContainer}>
                            {devices.map((device) => (
                                <View key={device.id} style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{device.name}</Text>
                                    <Text style={styles.detailValue}>{device.deviceId}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Additional Settings */}
                <View style={styles.additionalContainer}>
                    <TouchableOpacity style={styles.option} onPress={() => toggleSection("help")}>
                        <Ionicons name="help-circle-outline" size={24} color="black" />
                        <Text style={styles.optionText}>Help</Text>
                    </TouchableOpacity>
                    {/* Help Details (Visible when expanded) */}
                    {expandedSection === "help" && (
                        <View style={styles.userDetailsContainer}>
                            <Text style={styles.detailLabelTitle}>Home Screen</Text>
                            <Text style={styles.detailLabel}>1. Owner can add more devices but driver can add only one device</Text>
                            <Text style={styles.detailLabel}>2. You can add devices with any name what you want and anytime you can remove added devices.</Text>
                            <Text style={styles.detailLabel}>3. Drive can active alarm, get emergency call to owner, check temperature and humidity in vehicle using action button.</Text>
                            <Text style={styles.detailLabelTitle}>Map functions</Text>
                            <Text style={styles.detailLabel}>1. Driver can navigate route between selected town and vehicle. when driver navigating, owner can check that route.</Text>
                            <Text style={styles.detailLabel}>2. When driver or owner stay outside, they can navigate vehicle position using "Find Vehicle" button.</Text>
                            <Text style={styles.detailLabel}>3. Using "Focus on Vehicle" button, you can stay focus on your vehicle.</Text>
                            <Text style={styles.detailLabel}>4. Owner can active alarm, check temperature and humidity in vehicle and speed of vehicle using action button.</Text>
                            <Text style={styles.detailLabelTitle}>Settings</Text>
                            <Text style={styles.detailLabel}>1. You can change your profile picture, name, phone number and password in settings section.</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => navigation.jumpTo('About Us')}
                    >
                        <Ionicons name="information-circle-outline" size={24} color="black" />
                        <Text style={styles.optionText}>About</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={handleLogout}>
                        <Ionicons name="log-out" size={24} color="black" />
                        <Text style={styles.optionText}>Log out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Personal info Change Modal */}
            <Modal visible={isEditModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Personal Info</Text>

                        {/* Name Input */}
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            value={editedName}
                            onChangeText={setEditedName}
                        />

                        {/* Phone Number Input */}
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            value={editedPhoneNumber}
                            onChangeText={setEditedPhoneNumber}
                            keyboardType="phone-pad"
                        />

                        {/* Modal Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsEditModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveDetails}
                            >
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Password Change Modal */}
            <Modal visible={isPasswordModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change Password</Text>

                        {/* Current Password Input */}
                        <TextInput
                            style={styles.input}
                            placeholder="Current Password"
                            secureTextEntry={true}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />

                        {/* New Password Input */}
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            secureTextEntry={true}
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        {/* Confirm New Password Input */}
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            secureTextEntry={true}
                            value={confirmNewPassword}
                            onChangeText={setConfirmNewPassword}
                        />

                        {/* Modal Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsPasswordModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleChangePassword}
                            >
                                <Text style={styles.buttonText}>Save</Text>
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
    scrollContainer: {
        paddingBottom: 150
    },
    profileSection: {
        height: 260,
        alignItems: "center",
        paddingTop: 70,
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    profileName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    profileEmail: {
        fontSize: 14,
        color: "#666",
    },
    settingsContainer: {
        marginTop: 10,
        paddingHorizontal: 20,
    },
    additionalContainer: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 15,
        marginVertical: 5,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 5,
    },
    optionText: {
        fontSize: 16,
        marginLeft: 15,
        color: "#333",
    },
    userDetailsContainer: {
        backgroundColor: "#rgb(227, 239, 244)",
        padding: 15,
        borderRadius: 10,
        marginVertical: 5,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    detailLabelTitle: {
        fontSize: 14,
        color: "#000",
        fontWeight: 'bold',
        marginVertical: 10
    },
    detailLabel: {
        fontSize: 14,
        color: "#666",
        paddingLeft: 5,
        marginBottom: 5
    },
    detailValue: {
        fontSize: 14,
        color: "#333",
        fontWeight: "bold",
    },
    editButton: {
        backgroundColor: "rgb(78, 188, 227)",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 5,
    },
    editButtonText: {
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
        borderRadius: 15,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
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
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#ccc",
        fontSize: 16,
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 8,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    modalButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 4,
    },
    cancelButton: {
        backgroundColor: "rgb(109, 125, 132)",
        marginRight: 8,
    },
    saveButton: {
        backgroundColor: "rgb(78, 188, 227)",
        marginLeft: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default SettingsScreen;
