import React from "react";
import { View, Text, Image, StyleSheet, ScrollView, ImageBackground } from "react-native";

export default function AboutUsScreen() {
    return (
        <ImageBackground
            source={require('../../assets/BackgroundAbout.png')}
            style={styles.background}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                <Image source={require("../../assets/logo_transparent.png")} style={styles.logo} />
                <Text style={{ textAlign: 'center', marginTop: -35 }}>Version 1.0.0</Text>

                <Text style={[styles.title,{marginBottom:50}]}>Team Members</Text>

                {/* Instructors Section */}
                <Text style={styles.sectionTitle}>Department of Computer Engineering</Text>
                <View style={styles.instructorsContainer}>
                    <View style={styles.instructor}>
                        <Image source={require("../../assets/TeamMembers/Pramuda.jpeg")} style={styles.instructorImage} />
                        <Text style={styles.instructorName}>Pramuda Kulathunga</Text>
                    </View>
                    <View style={styles.instructor}>
                        <Image source={require("../../assets/TeamMembers/Pasindu.jpeg")} style={styles.instructorImage} />
                        <Text style={styles.instructorName}>Pasindu Chandrasiri</Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 40 }]}>Department of Electrical & Electronic Engineering</Text>
                <View style={styles.instructorsContainer}>
                    <View style={styles.instructor}>
                        <Image source={require("../../assets/TeamMembers/Sasindu.jpeg")} style={styles.instructorImage} />
                        <Text style={styles.instructorName}>Sasindu Amesh</Text>
                    </View>
                    <View style={styles.instructor}>
                        <Image source={require("../../assets/TeamMembers/Dulara.jpeg")} style={styles.instructorImage} />
                        <Text style={styles.instructorName}>Dulara Shrimantha</Text>
                    </View>
                </View>

                {/* About Section */}
                <Text style={styles.title}>About</Text>
                <Text style={styles.description}>
                    SmartTrack is an advanced IoT-based vehicle monitoring and control system designed for rent-a-car service owners. By integrating an ESP32-powered module with GPS tracking, speed monitoring, fire detection, and parking management, SmartTrack enhances vehicle safety and accountability. The system uses an A9G module for real-time GPS and GSM communication, while a DHT11 sensor monitors temperature conditions. Alerts are triggered through buzzers and LEDs, ensuring prompt responses to critical events. With seamless mobile app connectivity via MQTT, owners can efficiently track and manage their fleet anytime, anywhere.            </Text>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 150
    },
    logo: {
        marginTop: 30,
        width: 120,
        height: 120,
        alignSelf: "center",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: 30,
        marginBottom: 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 10,
        textAlign: 'center'
    },
    instructorsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 10,
    },
    instructor: {
        alignItems: "center"
    },
    instructorImage: {
        width: 60,
        height: 60,
        borderRadius: 30
    },
    instructorName: {
        marginTop: 5,
        fontSize: 14
    },
    description: {
        fontSize: 14,
        color: "#666",
        marginVertical: 10,
        textAlign: "justify",
        paddingLeft: 10,
        paddingRight: 10
    },
});
