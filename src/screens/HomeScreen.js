import React, { useState, useCallback, useEffect } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, TextInput, Modal, ImageBackground, Keyboard, Alert } from "react-native";
import { Card } from "react-native-paper";
import { database, ref, set, get, onValue, off, push, update, remove } from '../firebaseConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../Component/CustomAlert';
import { useFocusEffect } from "@react-navigation/native";
import FloatingActionButton from "../Component/FloatingActionButton";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = ({ setIsMapIconVisible }) => {
    // Modal & Input State
    const [devices, setDevices] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState("");
    const [newDeviceId, setNewDeviceId] = useState("");
    const [userData, setUserData] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [driverNotifications, setDriverNotifications] = useState([]);
    const [driverNotificationModalVisible, setDriverNotificationModalVisible] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [pendingDevices, setPendingDevices] = useState([]);
    const navigation = useNavigation();

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

    // Set up real-time listener when userData is available
    useEffect(() => {
        if (userData && userData.email) {
            const emailKey = userData.email.replace(/\./g, ',');
            const devicesRef = ref(database, `users/${emailKey}/devices`);

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

            // Set up real-time listener for notifications (for owners)
            if (userData.role === 'owner') {
                const notificationsRef = ref(database, `notifications/${emailKey}`);
                const unsubscribeNotifications = onValue(notificationsRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const notificationsData = snapshot.val();
                        // Convert object to array and filter pending requests
                        const pendingRequests = Object.entries(notificationsData)
                            .filter(([key, value]) => value.status === 'pending')
                            .map(([key, value]) => ({ id: key, ...value }));
                        setNotifications(pendingRequests);
                    } else {
                        setNotifications([]);
                    }
                });

                // Clean up both listeners on unmount
                return () => {
                    off(devicesRef, 'value', unsubscribeDevices);
                    off(notificationsRef, 'value', unsubscribeNotifications);
                };
            }
            else if (userData.role === 'driver') {
                // Set up real-time listener for driver notifications
                const driverNotificationsRef = ref(database, `driverNotifications/${emailKey}`);
                const unsubscribeDriverNotifications = onValue(driverNotificationsRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const notificationsData = snapshot.val();
                        const driverNotificationsList = Object.entries(notificationsData)
                            .map(([key, value]) => ({ id: key, ...value }));
                        setDriverNotifications(driverNotificationsList);
                    } else {
                        setDriverNotifications([]);
                    }
                });

                // Set up real-time listener for pending devices
                const pendingDevicesRef = ref(database, `pendingDevices/${emailKey}`);
                const unsubscribePendingDevices = onValue(pendingDevicesRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const pendingDevicesData = snapshot.val();
                        const pendingDevicesList = Object.entries(pendingDevicesData)
                            .map(([key, value]) => ({ id: key, ...value }));
                        setPendingDevices(pendingDevicesList);
                    } else {
                        setPendingDevices([]);
                    }
                });

                // Add to cleanup function
                return () => {
                    off(devicesRef, 'value', unsubscribeDevices);
                    off(driverNotificationsRef, 'value', unsubscribeDriverNotifications);
                    off(pendingDevicesRef, 'value', unsubscribePendingDevices);
                };
            }
        }
    }, [userData]);

    // Fetch user data when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const fetchUserData = async () => {
                const storedUserData = await AsyncStorage.getItem("userData");
                if (storedUserData) {
                    const parsedUserData = JSON.parse(storedUserData);
                    setUserData(parsedUserData);
                    setUserRole(parsedUserData.role);

                    // For drivers, set the first vehicle ID if available
                    if (parsedUserData.role === 'driver' && parsedUserData.devices && parsedUserData.devices.length > 0) {
                        setDeviceId(parsedUserData.devices[0].deviceId);
                    }
                }
            };
            fetchUserData();
        }, [])
    );

    const handleNavigateToMap = (deviceId, userRole) => {
        navigation.navigate('Map', { deviceId, userRole });
    };

    const addDevice = async () => {
        // Prevent multiple clicks while processing
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
                setModalVisible(false);
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
            setModalVisible(false);
        } catch (error) {
            console.error("Error adding device:", error);
            showAlert("Error", "Failed to add device. Please try again.");
        } finally {
            setIsAdding(false);
        }
    };

    const removeDevice = async (deviceId) => {
        showAlert(
            "Delete Device",
            "Are you sure you want to delete this device?",
            true,
            async () => {
                const updatedDevices = devices.filter(device => device.deviceId !== deviceId);
                const emailKey = userData.email.replace(/\./g, ',');

                // Update Firebase
                await set(ref(database, `users/${emailKey}/devices`), updatedDevices);

                // Also update AsyncStorage
                await AsyncStorage.setItem('userData', JSON.stringify({ ...userData, devices: updatedDevices }));

                setIsAlertVisible(false);
            }
        );
    };

    const handleNotificationResponse = async (notificationId, accepted) => {
        const emailKey = userData.email.replace(/\./g, ',');
        const notificationRef = ref(database, `notifications/${emailKey}/${notificationId}`);

        if (accepted) {
            // Update notification status
            await update(notificationRef, { status: 'accepted' });

            // Add vehicle to driver's account
            const notification = notifications.find(n => n.id === notificationId);
            if (notification) {
                const driverEmailKey = notification.driverEmail.replace(/\./g, ',');
                const driverDevicesRef = ref(database, `users/${driverEmailKey}/devices`);

                const driverDevicesSnapshot = await get(driverDevicesRef);
                let driverDevices = [];

                if (driverDevicesSnapshot.exists()) {
                    driverDevices = Array.isArray(driverDevicesSnapshot.val()) ?
                        driverDevicesSnapshot.val() : Object.values(driverDevicesSnapshot.val());
                }

                const newDevice = {
                    id: (driverDevices.length + 1).toString(),
                    name: notification.deviceName,
                    deviceId: notification.deviceId,
                    status: "Hired",
                    driverName: notification.driverName,
                    driverEmail: notification.driverEmail
                };

                const updatedDriverDevices = [...driverDevices, newDevice];
                await set(driverDevicesRef, updatedDriverDevices);

                // Remove from driver's pending devices
                const pendingDevicesRef = ref(database, `pendingDevices/${driverEmailKey}`);
                const pendingDevicesSnapshot = await get(pendingDevicesRef);
                if (pendingDevicesSnapshot.exists()) {
                    const pendingDevicesData = pendingDevicesSnapshot.val();
                    const updatedPendingDevices = {};

                    Object.entries(pendingDevicesData).forEach(([key, value]) => {
                        if (value.deviceId !== notification.deviceId) {
                            updatedPendingDevices[key] = value;
                        }
                    });

                    await set(pendingDevicesRef, updatedPendingDevices);
                }

                // Update vehicle status in devices node
                const deviceRef = ref(database, `devices/${notification.deviceId}`);
                await update(deviceRef, { status: 'hired' });

                // Update vehicle status in owner's vehicle list
                const ownerDevices = devices.map(device =>
                    device.deviceId === notification.deviceId ?
                        { ...device, status: 'Hired', driverName: notification.driverName, driverEmail: notification.driverEmail } : device
                );

                await set(ref(database, `users/${emailKey}/devices`), ownerDevices);
                setDevices(ownerDevices);

                // Send notification to driver
                const driverNotificationRef = ref(database, `driverNotifications/${driverEmailKey}`);
                const newDriverNotificationRef = push(driverNotificationRef);
                await set(newDriverNotificationRef, {
                    type: 'request_accepted',
                    deviceId: notification.deviceId,
                    deviceName: notification.deviceName,
                    status: 'accepted',
                    timestamp: Date.now(),
                    message: `Your request for vehicle "${notification.deviceName}" has been accepted`
                });

                showAlert("Success", "Device request accepted. The driver can now access the device.");
            }
        } else {
            // Update notification status to rejected
            await update(notificationRef, { status: 'rejected' });

            // Send notification to driver
            const notification = notifications.find(n => n.id === notificationId);
            if (notification) {
                const driverEmailKey = notification.driverEmail.replace(/\./g, ',');
                const driverNotificationRef = ref(database, `driverNotifications/${driverEmailKey}`);
                const newDriverNotificationRef = push(driverNotificationRef);
                await set(newDriverNotificationRef, {
                    type: 'request_rejected',
                    deviceId: notification.deviceId,
                    deviceName: notification.deviceName,
                    status: 'rejected',
                    timestamp: Date.now(),
                    message: `Your request for" vehicle "${notification.deviceName}" has been rejected`
                });

                // Remove from driver's pending devices
                const pendingDevicesRef = ref(database, `pendingDevices/${driverEmailKey}`);
                const pendingDevicesSnapshot = await get(pendingDevicesRef);
                if (pendingDevicesSnapshot.exists()) {
                    const pendingDevicesData = pendingDevicesSnapshot.val();
                    const updatedPendingDevices = {};

                    Object.entries(pendingDevicesData).forEach(([key, value]) => {
                        if (value.deviceId !== notification.deviceId) {
                            updatedPendingDevices[key] = value;
                        }
                    });

                    await set(pendingDevicesRef, updatedPendingDevices);
                }
            }

            showAlert("Info", "Device request rejected.");
        }

        // Remove the notification from local state
        setNotifications(notifications.filter(n => n.id !== notificationId));
    };

    const removeDriverDevice = async (deviceId, driverEmail) => {
        showAlert(
            "Remove vehicle from Driver",
            "Are you sure you want to remove this vehicle from the driver?",
            true,
            async () => {
                try {
                    // Remove vehicle from driver's account
                    const driverEmailKey = driverEmail.replace(/\./g, ',');
                    const driverDevicesRef = ref(database, `users/${driverEmailKey}/devices`);
                    const driverDevicesSnapshot = await get(driverDevicesRef);

                    if (driverDevicesSnapshot.exists()) {
                        let driverDevices = Array.isArray(driverDevicesSnapshot.val()) ?
                            driverDevicesSnapshot.val() : Object.values(driverDevicesSnapshot.val());

                        const updatedDriverDevices = driverDevices.filter(device => device.deviceId !== deviceId);
                        await set(driverDevicesRef, updatedDriverDevices);

                        // Send notification to driver about vehicle removal
                        const driverNotificationRef = ref(database, `driverNotifications/${driverEmailKey}`);
                        const newDriverNotificationRef = push(driverNotificationRef);
                        await set(newDriverNotificationRef, {
                            type: 'device_removed',
                            deviceId: deviceId,
                            status: 'removed',
                            timestamp: Date.now(),
                            message: `The vehicle (${deviceId})has been removed from your account by the owner`
                        });
                    }

                    // Update vehicle status in devices node
                    const deviceRef = ref(database, `devices/${deviceId}`);
                    await update(deviceRef, { status: 'not hired' });

                    // Update vehicle status in owner's vehicle list
                    const updatedDevices = devices.map(device =>
                        device.deviceId === deviceId ?
                            { ...device, status: 'Not Hired', driverName: null, driverEmail: null } : device
                    );

                    const emailKey = userData.email.replace(/\./g, ',');
                    await set(ref(database, `users/${emailKey}/devices`), updatedDevices);
                    setDevices(updatedDevices);

                    showAlert("Success", "Device removed from driver successfully.");
                } catch (error) {
                    showAlert("Error", "Failed to remove vehicle from driver.");
                }
            }
        );
    };

    const clearDriverNotification = async (notificationId) => {
        try {
            const emailKey = userData.email.replace(/\./g, ',');
            const notificationRef = ref(database, `driverNotifications/${emailKey}/${notificationId}`);

            await remove(notificationRef);
            setDriverNotifications(prev => prev.filter(notification => notification.id !== notificationId));

        } catch (error) {
            console.error("Error clearing notification:", error);
            showAlert("Error", "Failed to clear notification. Please try again.");
        }
    };

    const clearAllDriverNotifications = async () => {
        try {
            const emailKey = userData.email.replace(/\./g, ',');
            const notificationsRef = ref(database, `driverNotifications/${emailKey}`);

            await remove(notificationsRef);

            setDriverNotifications([]);

            showAlert("Success", "All notifications cleared.");
        } catch (error) {
            console.error("Error clearing all notifications:", error);
            showAlert("Error", "Failed to clear notifications. Please try again.");
        }
    };

    return (
        <View style={styles.backgroundContainer}>
            <ImageBackground
                source={require('../../assets/Background.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={{ display: 'flex', position: 'absolute', right: 20, top: 40, flexDirection: 'row' }}>
                    {userRole === 'driver' && (
                        <TouchableOpacity
                            style={[styles.notificationIcon, { marginRight: 15 }]}
                            onPress={() => setDriverNotificationModalVisible(true)}
                        >
                            <Ionicons name="notifications" size={28} color="#fff" />
                            <View style={styles.notificationBadge}>
                                <Text style={styles.badgeText}>{driverNotifications.length}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    {userRole === 'owner' && (
                        <TouchableOpacity
                            style={styles.notificationIcon}
                            onPress={() => setNotificationModalVisible(true)}
                        >
                            <Ionicons name="notifications" size={28} color="#fff" />
                            <View style={styles.notificationBadge}>
                                <Text style={styles.badgeText}>{notifications.length}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>SmartTrack</Text>
                    </View>
                </View>
                <View style={{ marginTop: 80 }} />

                <View style={styles.buttonContainer}>
                    {devices.length === 0 && pendingDevices.length === 0 ? (
                        <View style={styles.placeholderContainer}>
                            <Text style={styles.placeholderText}>No devices added yet.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={[...devices, ...pendingDevices]}
                            keyExtractor={(item) => item.deviceId || item.id}
                            scrollEnabled={true}
                            renderItem={({ item }) => (
                                <Card style={[
                                    styles.card,
                                    {
                                        marginTop: userRole === 'driver' ? 30 : 0,
                                        backgroundColor: item.status === "Hired" ? "rgba(176, 254, 193, 1)" :
                                            item.status === "pending" ? "rgba(255, 220, 150, 1)" : "rgba(254, 176, 202, 1)",
                                        opacity: item.status === "pending" ? 0.7 : 1
                                    }
                                ]}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (item.status !== "pending") {
                                                handleNavigateToMap(item.deviceId, userData.role);
                                            }
                                        }}
                                        disabled={item.status === "pending"}
                                    >
                                        <View style={styles.cardContent}>
                                            <Image source={require("../../assets/gps.png")} style={styles.image} />
                                            <View style={styles.deviceInfo}>
                                                <Text style={styles.itemName}>{item.name || item.deviceName}</Text>
                                                <Text style={styles.itemPrice}>ID: {item.deviceId}</Text>
                                                <Text style={styles.itemPrice}>Status: {item.status === "pending" ? "Pending Approval" : item.status}</Text>
                                                {userRole === 'owner' && item.status === "Hired" && (
                                                    <Text style={styles.driverInfo}>
                                                        Hired by: {item.driverName || "Unknown Driver"}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.cardActions}>
                                                {userRole === 'owner' && item.status === "Hired" && (
                                                    <TouchableOpacity
                                                        onPress={() => removeDriverDevice(item.deviceId, item.driverEmail)}
                                                        style={styles.removeDriverButton}
                                                    >
                                                        <Ionicons name="person-remove" size={22} color="red" />
                                                    </TouchableOpacity>
                                                )}
                                                {item.status !== "pending" && (
                                                    <TouchableOpacity onPress={() => removeDevice(item.deviceId)} style={styles.trash}>
                                                        <Ionicons name="trash" size={25} color="red" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </Card>
                            )}
                        />
                    )}

                    <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                        <Text style={styles.addButtonText}>Add New Device</Text>
                    </TouchableOpacity>
                </View>

                {/* Floating route button for drivers */}
                {userRole === 'driver' && devices.length > 0 && (
                    <View style={styles.fabContainer}>
                        <FloatingActionButton userRole={userRole} deviceId={deviceId} />
                    </View>
                )}

                {/* Modal for Adding vehicle */}
                <Modal visible={modalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Add New Device</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Device Name"
                                value={newDeviceName}
                                placeholderTextColor="rgba(15, 164, 220, 0.7)"
                                onChangeText={setNewDeviceName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Device ID"
                                value={newDeviceId}
                                placeholderTextColor="rgba(15, 164, 220, 0.7)"
                                onChangeText={setNewDeviceId}
                            />
                            <Text style={styles.helpText}>
                                {userRole === 'driver'
                                    ? "Enter the vehicle ID provided by the owner. Your request will be sent for approval."
                                    : "Enter a valid vehicle ID that exists in the system."}
                            </Text>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.submitButton, isAdding && styles.submitButtonDisabled]}
                                    onPress={addDevice}
                                    disabled={isAdding}
                                >
                                    <Text style={styles.buttonText}>
                                        {isAdding ? 'Processing...' : (userRole === 'driver' ? 'Request' : 'Add')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Notifications Modal for Owners */}
                <Modal visible={notificationModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                            <Text style={styles.modalTitle}>Notifications</Text>
                            {notifications.length === 0 ? (
                                <Text style={styles.noNotificationsText}>No more Notifications</Text>
                            ) : (
                                <FlatList
                                    data={notifications}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => (
                                        <View style={styles.notificationItem}>
                                            <Text style={styles.notificationText}>
                                                <Text style={styles.boldText}>{item.driverName}</Text>
                                                {" "}wants to access vehicle {" "}
                                                <Text style={styles.boldText}>{item.deviceName}</Text> (ID: {item.deviceId})
                                            </Text>
                                            <View style={styles.notificationActions}>
                                                <TouchableOpacity
                                                    style={styles.acceptButton}
                                                    onPress={() => handleNotificationResponse(item.id, true)}
                                                >
                                                    <Text style={styles.buttonText}>Accept</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.rejectButton}
                                                    onPress={() => handleNotificationResponse(item.id, false)}
                                                >
                                                    <Text style={styles.buttonText}>Reject</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                />
                            )}
                            {driverNotifications.length > 0 && (
                                <TouchableOpacity
                                    style={[styles.closeButton, { backgroundColor: 'red' }]}
                                    onPress={clearAllDriverNotifications}
                                >
                                    <Text style={styles.buttonText}>Clear All</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setNotificationModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Notifications Modal for Drivers */}
                <Modal visible={driverNotificationModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                            <Text style={styles.modalTitle}>Notifications</Text>
                            {driverNotifications.length === 0 ? (
                                <Text style={styles.noNotificationsText}>No Notifications</Text>
                            ) : (
                                <FlatList
                                    data={driverNotifications}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => (
                                        <View style={styles.notificationItem}>
                                            <Text style={styles.notificationText}>{item.message}</Text>
                                            <Text style={styles.notificationTime}>
                                                {new Date(item.timestamp).toLocaleString()}
                                            </Text>
                                            <TouchableOpacity
                                                style={[styles.closeButtonNotification]}
                                                onPress={() => clearDriverNotification(item.id)}
                                            >
                                                <Text style={styles.buttonText}>Clear</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                />
                            )}
                            {driverNotifications.length > 0 && (
                                <TouchableOpacity
                                    style={[styles.closeButton, { backgroundColor: 'red' }]}
                                    onPress={clearAllDriverNotifications}
                                >
                                    <Text style={styles.buttonText}>Clear All</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setDriverNotificationModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Close</Text>
                            </TouchableOpacity>
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
        </View>
    );
};

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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 50,
    },
    titleContainer: {
        marginTop: 80,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    title: {
        fontSize: 50,
        color: '#fff',
        fontWeight: 'bold',
    },
    notificationIcon: {
        position: 'relative',
        padding: 10,
    },
    notificationBadge: {
        position: 'absolute',
        right: 5,
        top: 5,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    buttonContainer: {
        width: "100%",
        maxHeight: "50%",
        paddingHorizontal: 20,
        zIndex: 100,
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
        justifyContent: 'flex-start',
    },
    deviceInfo: {
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    removeDriverButton: {
        marginRight: 15,
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
    driverInfo: {
        fontSize: 12,
        color: "rgb(100, 100, 100)",
        fontStyle: 'italic',
    },
    trash: {
        marginRight: 10
    },
    addButton: {
        display: 'flex',
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
        height: '100vh'
    },
    modalContent: {
        width: "80%",
        backgroundColor: "rgb(219, 240, 248)",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#333"
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
    helpText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "rgb(74, 85, 89)",
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
    submitButtonDisabled: {
        backgroundColor: "#ccc",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    fabContainer: {
        position: 'absolute',
        bottom: 80,
        right: 10,
    },
    notificationItem: {
        padding: 15,
        borderBottomWidth: 2,
        backgroundColor: '#eee',
        borderBottomColor: '#ffffffff',
        alignItems: 'center',
        width: '100%',
    },
    notificationText: {
        fontSize: 14,
        marginBottom: 10,
    },
    notificationTime: {
        fontSize: 12,
        color: '#666',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    boldText: {
        fontWeight: 'bold',
    },
    notificationActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    acceptButton: {
        backgroundColor: 'rgb(78, 188, 227)',
        padding: 8,
        borderRadius: 5,
        flex: 1,
        marginRight: 5,
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: 'rgb(74, 85, 89)',
        padding: 8,
        borderRadius: 5,
        flex: 1,
        marginLeft: 5,
        alignItems: 'center',
    },
    noNotificationsText: {
        fontSize: 16,
        color: '#666',
        marginVertical: 20,
    },
    closeButton: {
        backgroundColor: "rgb(74, 85, 89)",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 15,
        width: '100%',
    },
    closeButtonNotification: {
        backgroundColor: "rgba(120, 126, 128, 1)",
        padding: 5,
        width: 60,
        borderRadius: 5,
        alignItems: "center",
    },
});

export default HomeScreen;