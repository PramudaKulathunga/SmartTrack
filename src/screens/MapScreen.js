import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback, FlatList } from 'react-native';
import MapView, { UrlTile, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { database, ref, onValue, update } from '../firebaseConfig';
import CustomAlert from '../Component/CustomAlert';
import FloatingActionButton from '../Component/FloatingActionButton';

export default function MapScreen({ route, navigation }) {
    const { deviceId, userRole } = route.params;
    const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
    const [userLocation, setUserLocation] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [townName, setTownName] = useState('');
    const [townCoordinates, setTownCoordinates] = useState({ latitude: 0, longitude: 0 });
    const [isTownRouteActive, setIsTownRouteActive] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const [isFocusing, setIsFocusing] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [suggestions, setSuggestions] = useState([]);

    const mapRef = useRef(null);

    const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf62489328cf8a43884ad88e8424d11b28b37b';

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
            showAlert("Error", "Device ID is missing");
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

                // Set town coordinates, navigation and townName activation status from Firebase
                if (data.townCoordinates) {
                    setTownCoordinates(data.townCoordinates);
                } else {
                    setTownCoordinates(null);
                }

                if (data.townNavigationActivation) {
                    setIsTownRouteActive(data.townNavigationActivation === 1);
                    if (data.townNavigationActivation === 0) {
                        setRouteCoordinates([]);
                    }
                } else {
                    setIsTownRouteActive(false);
                }

                if (data.townName) {
                    setTownName(data.townName);
                } else {
                    setTownName('');
                }

                // Focus the map on the new coordinates
                if (isFirstLoad && mapRef.current) {
                    mapRef.current.animateToRegion({
                        ...newLocation,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }, 1000);
                    setIsFirstLoad(false);
                }
            } else {
                showAlert("Error", "Device data not found in Firebase");
            }
        });

        return () => unsubscribe();
    }, [deviceId, isFirstLoad]);

    // Fetch city suggestions as the user types
    const fetchCitySuggestions = async (query) => {
        if (query.trim() === '') {
            setSuggestions([]);
            return;
        }

        const url = `https://api.openrouteservice.org/geocode/autocomplete?api_key=${OPENROUTESERVICE_API_KEY}&text=${query}&boundary.country=LK`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const suggestions = data.features.map(feature => feature.properties.label);
                setSuggestions(suggestions);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error("Autocomplete Error:", error);
            setSuggestions([]);
        }
    };

    //Device focusing
    useEffect(() => {
        let intervalId;

        if (isFocusing && mapRef.current) {
            intervalId = setInterval(() => {
                mapRef.current.animateToRegion({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }, 1000);
            }, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isFocusing, location]);

    // Get user's current location and fetch route when navigating
    useEffect(() => {
        let locationSubscription;

        const startLocationTracking = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert("Warning!", "Permission to access location was denied");
                return;
            }
            // Start watching user's location
            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000,
                    distanceInterval: 5,
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
    }, [isNavigating, userLocation, location]);

    // Refetch town-to-device route when location changes and Start mode is active
    useEffect(() => {
        if (isTownRouteActive && townCoordinates && location.latitude !== 0 && location.longitude !== 0) {
            fetchRoute(townCoordinates, location);
        }
    }, [location, isTownRouteActive, townCoordinates]);

    // Fetch route from OpenRouteService API
    const fetchRoute = async (start, end) => {
        const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${OPENROUTESERVICE_API_KEY}&start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const coordinates = data.features[0].geometry.coordinates.map(coord => ({
                    latitude: coord[1],
                    longitude: coord[0],
                }));
                setRouteCoordinates(coordinates);
            } else {
                showAlert("Route Error", "Failed to fetch route data. Please try again.");
            }
        } catch (error) {
            showAlert("Route Error", "An error occurred while fetching the route. Please try again.");
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

                // Check if the town is within Sri Lanka's boundaries
                const isInSriLanka = (
                    coordinates.latitude >= 5.9 && coordinates.latitude <= 9.9 &&
                    coordinates.longitude >= 79.5 && coordinates.longitude <= 81.9
                );

                if (!isInSriLanka) {
                    showAlert("Out of Range", "That city is overseas. Please enter a town within Sri Lanka.");
                    return null;
                }

                setTownCoordinates(coordinates);
                return coordinates;
            } else {
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
            // Stop town navigation
            setTownCoordinates(null);
            setRouteCoordinates([]);
            setIsTownRouteActive(false);

            const deviceRef = ref(database, `devices/${deviceId}`);
            await update(deviceRef, {
                townNavigationActivation: 0,
                townCoordinates: null,
                townName: null,
            }).catch((error) => {
                console.error("Firebase Update Error:", error);
            });
        } else {
            // Start town navigation
            if (townName.trim() === '') {
                showAlert("Empty", "Please enter a town name");
                return;
            }

            const coordinates = await geocodeTown(townName);
            if (coordinates) {
                setTownCoordinates(coordinates);
                setIsTownRouteActive(true);
                setIsNavigating(false);

                const deviceRef = ref(database, `devices/${deviceId}`);
                await update(deviceRef, {
                    townNavigationActivation: 1,
                    townCoordinates: coordinates,
                    townName: townName,
                }).catch((error) => {
                    console.error("Firebase Update Error:", error);
                });
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

    return (
        <TouchableWithoutFeedback onPress={() => {
            Keyboard.dismiss();
            setSuggestions([]);
        }}>

            <View style={styles.container}>
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

                    {/* OpenStreetMap tiles */}
                    <UrlTile
                        urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maximumZ={19}
                    />

                    {/* Vehicle Marker */}
                    <Marker
                        coordinate={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                        }}
                        title="Vehicle Location"
                        pinColor="green"
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

                {/* Text Input and Start/Stop Button */}
                {userRole === 'driver' && (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter town name"
                            value={townName}
                            onChangeText={(text) => {
                                setTownName(text);
                                fetchCitySuggestions(text);
                            }}
                        />
                        <TouchableOpacity
                            style={[styles.startStopButton, isNavigating && styles.disabledButton]}
                            onPress={handleTownRoute}
                            disabled={isNavigating}
                        >
                            <Text style={styles.startStopButtonText}>
                                {isTownRouteActive ? 'Stop' : 'Start'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                {/* Display Suggestions */}
                {suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestionItem}
                                    onPress={() => {
                                        setTownName(item); // Set the selected suggestion as the town name
                                        setSuggestions([]); // Clear suggestions
                                    }}
                                >
                                    <Text style={styles.suggestionText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                <View style={{
                    flexDirection: 'row',
                    zIndex: 300,
                    justifyContent: 'center',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                }}>
                    {/* Floating Focus on Device Button */}
                    <TouchableOpacity
                        style={[styles.floatingButton, styles.focusDeviceButton, { marginTop: userRole === 'driver' ? 105 : 10 }]}
                        onPress={() => {
                            setIsFocusing((prev) => !prev);
                        }}
                    >
                        <Text style={styles.floatingButtonText}>
                            {isFocusing ? 'Stop Focusing' : 'Focus on Vehicle'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.floatingButton, isTownRouteActive && styles.disabledButton, { marginTop: userRole === 'driver' ? 105 : 10 }]}
                        onPress={handleNavigate}
                        disabled={isTownRouteActive}
                    >
                        <Text style={styles.floatingButtonText}>
                            {isNavigating ? 'Stop Finding' : 'Find Vehicle'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Floating rote */}
                {userRole === 'owner' && (
                    <View style={styles.fabContainer}>
                        <FloatingActionButton userRole={userRole} deviceId={deviceId} />
                    </View>
                )}

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
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    inputContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        zIndex: 350,
        flexDirection: 'row',
        alignItems: 'center',
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
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
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
        ...StyleSheet.absoluteFillObject,
        zIndex: 0
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
        backgroundColor: 'gray',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 80,
        right: 10,
        zIndex: 200,
        width: 56,
        height: 56,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 90, // Adjust based on your layout
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        maxHeight: 150,
        zIndex: 350,
        elevation: 5,
    },
    suggestionItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 16,
    },
});