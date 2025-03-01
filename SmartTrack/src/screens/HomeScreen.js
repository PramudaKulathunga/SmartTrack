import { View, Text, Button, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text>Home Screen</Text>
            <Button title="Go to Map" onPress={() => navigation.navigate('Map')} />
            <Button title="Go to About Us" onPress={() => navigation.navigate('About Us')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        color:'black',
    },
});
