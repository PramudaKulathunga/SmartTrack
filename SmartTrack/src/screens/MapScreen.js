import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import MapView from 'react-native-maps';

export default function MapScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text>Map Screen</Text>
            <MapView style={styles.map} />
            <Button title="Go to Home" onPress={() => navigation.navigate('Home')} />
            <Button title="Go to About Us" onPress={() => navigation.navigate('About Us')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        width: '100%',
        height: 400,
    },
});
