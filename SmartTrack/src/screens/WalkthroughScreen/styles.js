import { StyleSheet } from 'react-native';

const dynamicStyles = (appStyles, colorScheme) => {
  return StyleSheet.create({
    title: {
      fontSize: 25,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingBottom: 25,
      color: 'white',
    },
    text: {
      fontSize: 18,
      textAlign: 'center',
      color: 'white',
      paddingLeft: 10,
      paddingRight: 10,
    },
    image: {
      width: 100,
      height: 100,
      marginBottom: 60,
      tintColor: 'white',
    },
    button: {
      fontSize: 18,
      color: 'white',
      marginTop: 10,
    },
    startButton: {
      marginTop: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: "rgb(254, 255, 255)",
      borderRadius: 5,
      alignItems: "center",
    },
    startButtonText: {
      color: "rgb(19, 75, 75)",
      fontSize: 16,
      fontWeight: "bold",
    },
  });
};

export default dynamicStyles;
