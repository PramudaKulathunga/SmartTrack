import React, { useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const SettingsScreen = ({ navigation }) => {
    const [image, setImage] = useState(null);

    // Function to pick an image
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.All,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.profileSection}>
                <TouchableOpacity onPress={pickImage}>
                    <Image
                        source={image ? { uri: image } : require("../../assets/TeamMembers/Pramuda.jpeg")}
                        style={styles.profileImage}
                    />
                </TouchableOpacity>
                <Text style={styles.profileName}>Pramuda Kulathunga</Text>
                <Text style={styles.profileEmail}>pramudakulathunga@gmail.com</Text>
            </View>

            {/* Settings Options */}
            <View style={styles.settingsContainer}>
                <TouchableOpacity style={styles.option}>
                    <Ionicons name="person-circle-outline" size={24} color="black" />
                    <Text style={styles.optionText}>Personal Info</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <MaterialIcons name="security" size={24} color="black" />
                    <Text style={styles.optionText}>Password and Security</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Ionicons name="lock-closed-outline" size={24} color="black" />
                    <Text style={styles.optionText}>Privacy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Ionicons name="phone-portrait-outline" size={24} color="black" />
                    <Text style={styles.optionText}>Devices</Text>
                </TouchableOpacity>
            </View>

            {/* Additional Settings */}
            <View style={styles.additionalContainer}>
                <TouchableOpacity style={styles.option}>
                    <Ionicons name="help-circle-outline" size={24} color="black" />
                    <Text style={styles.optionText}>Help</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.option}
                    onPress={() => navigation.jumpTo('About Us')}
                >
                    <Ionicons name="information-circle-outline" size={24} color="black" />
                    <Text style={styles.optionText}>About</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        backgroundColor: "#fff",
        paddingBottom: 150
    },
    profileSection: {
        height: 260,
        alignItems: "center",
        paddingTop: 70,
        padding: 20,
        backgroundColor: "rgb(67, 190, 231)",
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
        elevation: 2,
    },
    optionText: {
        fontSize: 16,
        marginLeft: 15,
        color: "#333",
    },
});

export default SettingsScreen;
