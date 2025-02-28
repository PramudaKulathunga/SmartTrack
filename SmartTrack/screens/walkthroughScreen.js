import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function WalkthroughScreen({ navigation }) {
    const handleFinishWalkthrough = () => {
        // After finishing the walkthrough, navigate to the Home screen
        navigation.replace('Home');
    };

    return (
        <View style={styles.container}>
            <Text>Welcome to the App!</Text>
            <Button title="Finish Walkthrough" onPress={handleFinishWalkthrough} />
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
