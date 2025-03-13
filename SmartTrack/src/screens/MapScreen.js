import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { database, ref, onValue } from '../firebaseConfig';
import CustomAlert from '../Component/CustomAlert';

export default function MapScreen({ route }) {
    const { deviceId } = route.params;
    const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
    const [userLocation, setUserLocation] = useState(null);
    const [error, setError] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [townName, setTownName] = useState('');
    const [townCoordinates, setTownCoordinates] = useState(null);
    const [isTownRouteActive, setIsTownRouteActive] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const mapRef = useRef(null);

    const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf62489328cf8a43884ad88e8424d11b28b37b'; // Replace with your API key

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

    // Fetch device location from Firebase
    useEffect(() => {
        if (!deviceId) {
            setError("Device ID is missing.");
            return;
        }

        const deviceRef = ref(database, `devices/${deviceId}`);
        const unsubscribe = onValue(deviceRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const newLocation = {
                    latitude: data.latitude,
                    longitude: data.longitude,
                };
                setLocation(newLocation);

                // Focus the map on the new coordinates
                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        ...newLocation,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }, 1000);
                }
            } else {
                setError("Device data not found in Firebase.");
            }
        });

        return () => unsubscribe();
    }, [deviceId]);

    // Get user's current location and fetch route when navigating
    useEffect(() => {
        let locationSubscription;

        const startLocationTracking = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Permission to access location was denied.');
                return;
            }

            // Start watching user's location
            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000, // Update every second
                    distanceInterval: 10, // Update every 10 meters
                },
                (newLocation) => {
                    const { latitude, longitude } = newLocation.coords;
                    setUserLocation({ latitude, longitude });

                    // Focus the map on the user's location when navigating
                    if (isNavigating && mapRef.current) {
                        mapRef.current.animateToRegion({
                            latitude,
                            longitude,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        }, 1000);
                    }
                }
            );
        };

        if (isNavigating) {
            startLocationTracking();
        }

        // Cleanup function to stop location tracking
        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, [isNavigating]);

    // Fetch route from OpenRouteService API when device or user location changes
    useEffect(() => {
        if (isNavigating && userLocation && location.latitude !== 0 && location.longitude !== 0) {
            fetchRoute(userLocation, location);
        }
    }, [isNavigating, userLocation, location]); // Add location as a dependency

    // Refetch town-to-device route when location changes and Start mode is active
    useEffect(() => {
        if (isTownRouteActive && townCoordinates && location.latitude !== 0 && location.longitude !== 0) {
            fetchRoute(townCoordinates, location);
        }
    }, [location, isTownRouteActive, townCoordinates]); // Add location as a dependency

    // Fetch route from OpenRouteService API
    const fetchRoute = async (start, end) => {
        const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${OPENROUTESERVICE_API_KEY}&start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const coordinates = data.features[0].geometry.coordinates.map(coord => ({
                    latitude: coord[1], // Latitude is the second value
                    longitude: coord[0], // Longitude is the first value
                }));
                setRouteCoordinates(coordinates);
            } else {
                setError("Failed to fetch route data.");
            }
        } catch (error) {
            console.error("API Error:", error);
            setError("Error fetching route data: " + error.message);
        }
    };

    // Geocode town name to coordinates
    const geocodeTown = async (town) => {
        const url = `https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTESERVICE_API_KEY}&text=${town}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const coordinates = {
                    latitude: data.features[0].geometry.coordinates[1],
                    longitude: data.features[0].geometry.coordinates[0],
                };
                setTownCoordinates(coordinates);
                return coordinates;
            } else {
                // Show an alert if the town is not found
                showAlert("Town Not Found", "The town you entered could not be found. Please try again");
                return null;
            }
        } catch (error) {
            console.error("Geocoding Error:", error);
            showAlert("Geocoding Error", "An error occurred while fetching the town's coordinates. Please try again");
            return null;
        }
    };

    // Handle "Start/Stop" button press for town route
    const handleTownRoute = async () => {
        Keyboard.dismiss();

        if (isTownRouteActive) {
            setTownCoordinates(null);
            setRouteCoordinates([]);
            setIsTownRouteActive(false);
        } else {
            if (townName.trim() === '') {
                showAlert("Empty", "Please enter a town name");
                return;
            }

            const coordinates = await geocodeTown(townName);
            if (coordinates) {
                fetchRoute(coordinates, location);
                setIsTownRouteActive(true);
                setIsNavigating(false); // Disable Find Vehicle mode
            }
        }
    };

    // Handle "Navigate" button press
    const handleNavigate = () => {
        if (isNavigating) {
            setUserLocation(null);
            setRouteCoordinates([]);
        } else {
            setIsTownRouteActive(false);
        }
        setIsNavigating((prev) => !prev);
    };

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Text Input and Start/Stop Button */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter town name"
                    value={townName}
                    onChangeText={setTownName}
                />
                <TouchableOpacity
                    style={[styles.startStopButton, isNavigating && styles.disabledButton]}
                    onPress={handleTownRoute}
                    disabled={isNavigating} // Disable Start button when Find Vehicle is active
                >
                    <Text style={styles.startStopButtonText}>
                        {isTownRouteActive ? 'Stop' : 'Start'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', zIndex: 100 }}>
                {/* Floating Focus on Device Button */}
                <TouchableOpacity
                    style={[styles.floatingButton, styles.focusDeviceButton]}
                    onPress={() => {
                        if (mapRef.current) {
                            mapRef.current.animateToRegion({
                                latitude: location.latitude,
                                longitude: location.longitude,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }, 1000);
                        }
                    }}
                >
                    <Text style={styles.floatingButtonText}>Focus on Vehicle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.floatingButton, isTownRouteActive && styles.disabledButton]}
                    onPress={handleNavigate}
                    disabled={isTownRouteActive} // Disable Find Vehicle button when Start is active
                >
                    <Text style={styles.floatingButtonText}>
                        {isNavigating ? 'Stop Finding' : 'Find Vehicle'}
                    </Text>
                </TouchableOpacity>
            </View>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {/* Device Marker */}
                <Marker
                    coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }}
                    title="Device Location"
                />

                {/* Town Marker */}
                {townCoordinates && (
                    <Marker
                        coordinate={{
                            latitude: townCoordinates.latitude,
                            longitude: townCoordinates.longitude,
                        }}
                        title="Town Location"
                        pinColor="green"
                    />
                )}

                {/* User Marker */}
                {userLocation && (
                    <Marker
                        coordinate={{
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                        }}
                        title="Your Location"
                        pinColor="blue"
                    />
                )}

                {/* Polyline between town and device */}
                {isTownRouteActive && routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor="#0000FF"
                        strokeWidth={4}
                    />
                )}

                {/* Polyline between user and device */}
                {isNavigating && routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor="#FF0000"
                        strokeWidth={4}
                    />
                )}
            </MapView>

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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        zIndex: 100,
        marginTop: 50,
        marginHorizontal: 20
    },
    input: {
        flex: 1,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginRight: 10,
        backgroundColor: 'white',
    },
    startStopButton: {
        backgroundColor: 'rgb(67, 190, 231)',
        padding: 8,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    startStopButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    map: {
        width: '100%',
        height: '100%',
        marginTop: -150,
    },
    floatingButton: {
        alignSelf: 'center',
        backgroundColor: "rgb(67, 190, 231)",
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        width: '40%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
        marginHorizontal: 10,
        marginVertical: 10,
        marginTop: 10,
    },
    focusDeviceButton: {
        backgroundColor: "rgb(27, 107, 134)",
    },
    floatingButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
    },
    disabledButton: {
        backgroundColor: 'gray', // Disabled button color
    },
});