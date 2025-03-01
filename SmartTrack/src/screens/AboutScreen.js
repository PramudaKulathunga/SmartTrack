import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function AboutUsScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text>About Us Screen</Text>
            <Button title="Go to Map" onPress={() => navigation.navigate('Map')} />
            <Button title="Go to Home" onPress={() => navigation.navigate('Home')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
