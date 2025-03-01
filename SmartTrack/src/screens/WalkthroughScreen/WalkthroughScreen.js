import React from "react";
import { View, Image, Text, useColorScheme, TouchableOpacity, StatusBar } from "react-native";
import PropTypes from "prop-types";
import AppIntroSlider from "react-native-app-intro-slider";
import dynamicStyles from "./styles";
import WalkthroughAppConfig from "./WalkthroughAppConfig";
import DynamicAppStyle from "../../DynamicAppStyles";
import GradientBackground from "../../Component/GradientContainer";

const WalkthroughScreen = ({navigation}) => {
  const appConfig = WalkthroughAppConfig;
  const appStyles = DynamicAppStyle;
  const colorScheme = useColorScheme();
  const styles = dynamicStyles(appStyles, colorScheme);

  const slides = appConfig.onboardingConfig.walkthroughScreens.map(
    (screenSpec, index) => {
      return {
        key: `${index}`,
        text: screenSpec.description,
        title: screenSpec.title,
        image: screenSpec.icon,
      };
    }
  );

  const _renderItem = ({ item, index }) => (
    <GradientBackground>
      <Image
        style={styles.image}
        source={item.image}
        size={100}
        color="white"
      />
      <View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>{item.text}</Text>
        {index === slides.length - 1 && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() =>  navigation.navigate('Home')}
          >
            <Text style={styles.startButtonText}>Start Journey</Text>
          </TouchableOpacity>
        )}
      </View>
    </GradientBackground>
  );

  return (
    <AppIntroSlider
      data={slides}
      slides={slides}
      renderItem={_renderItem}
      //Handler for the done On last slide
      showSkipButton={true}
      showDoneButton={false}
      showNextButton={false}
    />
  );
};

WalkthroughScreen.propTypes = {
  appStyles: PropTypes.object,
  appConfig: PropTypes.object,
};

export default WalkthroughScreen;
