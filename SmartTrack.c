#include <HardwareSerial.h>  // Library for serial communication
#include <TinyGPS++.h>      // Library for parsing GPS data
#include <DHT.h>            // Library for DHT11 sensor

// Pin Definitions
#define A9G_RX_PIN 16  // ESP32 GPIO connected to A9G TX
#define A9G_TX_PIN 17  // ESP32 GPIO connected to A9G RX
#define GPS_RX_PIN 18  // ESP32 GPIO connected to GPS TX
#define GPS_TX_PIN 19  // ESP32 GPIO connected to GPS RX
#define BUTTON_PIN 21  // GPIO for the push button
#define BUZZER_PIN 22  // GPIO for the buzzer
#define DHT_PIN 4      // GPIO for DHT11 sensor
#define DHT_TYPE DHT11 // Type of DHT sensor (DHT11)

// Serial objects for GSM and GPS modules
HardwareSerial A9GSerial(1);  // UART1 for GSM (A9G module)
HardwareSerial GPSSerial(2);  // UART2 for GPS module

// Objects for GPS and DHT11
TinyGPSPlus gps;  // Object to parse GPS data
DHT dht(DHT_PIN, DHT_TYPE);  // Object to read DHT11 sensor data

// Global Variables
String phoneNumber = "+94771620857";  // Phone number for SMS and calls
bool buzzerActive = false;   // Tracks if buzzer is active (Emergency Mode)
bool smsAlertActive = false; // Tracks if buzzer is active (SMS Alert)

// Function Prototypes
void initGSM();  // Initialize GSM module
void checkForIncomingSMS();  // Check for incoming SMS
void sendSMS(String number, String message);  // Send SMS
void makeCall(String number);  // Make a call
void sendCommand(String command, String expectedResponse, int timeout);  // Send AT command to GSM
String getGPSData();  // Get GPS data (latitude, longitude, speed)
String getDHTData();  // Get DHT11 data (temperature, humidity)

// Setup Function
void setup() {
  Serial.begin(115200);  // Start serial communication for debugging
  pinMode(BUTTON_PIN, INPUT_PULLUP);  // Set button pin as input with pull-up resistor
  pinMode(BUZZER_PIN, OUTPUT);  // Set buzzer pin as output
  dht.begin();  // Initialize DHT11 sensor

  // Initialize GPS module
  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  initGSM();  // Initialize GSM module
}

// Main Loop
void loop() {
  checkForIncomingSMS();  // Check for incoming SMS

  // Handle button press
  if (digitalRead(BUTTON_PIN) == LOW) {  // If button is pressed
    delay(200);  // Debounce delay to avoid multiple triggers
    buzzerActive = !buzzerActive;  // Toggle buzzer state

    if (buzzerActive) {  // If buzzer is activated
      Serial.println("Button Pressed! Making a call and sending SMS...");
      makeCall(phoneNumber);  // Make a call to the specified number
      delay(10000);  // Wait for 10 seconds before sending SMS
      String gpsMessage = getGPSData();  // Get GPS data
      String dhtMessage = getDHTData();  // Get DHT11 data
      Serial.println("GPS Data: " + gpsMessage);  // Print GPS data to serial monitor
      Serial.println("DHT11 Data: " + dhtMessage);  // Print DHT11 data to serial monitor
      sendSMS(phoneNumber, "Emergency! Please respond.\n" + gpsMessage + "\n" + dhtMessage);  // Send SMS with GPS and DHT11 data
    } else {  // If buzzer is deactivated
      Serial.println("Button Pressed Again! Stopping buzzer...");
      digitalWrite(BUZZER_PIN, LOW);  // Turn off the buzzer
    }

    delay(500);  // Prevent multiple triggers
  }

  // Blink buzzer if active (Emergency mode OR SMS Alert)
  if (buzzerActive || smsAlertActive) {
    digitalWrite(BUZZER_PIN, HIGH);  // Turn on buzzer
    delay(500);  // Wait for 500ms
    digitalWrite(BUZZER_PIN, LOW);  // Turn off buzzer
    delay(500);  // Wait for 500ms
  }
}

// Initialize GSM Module
void initGSM() {
  Serial.println("Initializing A9G...");
  A9GSerial.begin(115200, SERIAL_8N1, A9G_RX_PIN, A9G_TX_PIN);  // Start serial communication with GSM module
  delay(3000);  // Wait for GSM module to initialize
  sendCommand("AT+CMGF=1", "OK", 3000);  // Set SMS text mode
  sendCommand("AT+CNMI=1,2,0,0,0", "OK", 3000);  // Enable SMS notifications
}

// Send AT Command to GSM Module
void sendCommand(String command, String expectedResponse, int timeout) {
  A9GSerial.println(command);  // Send command to GSM module
  long int time = millis();  // Record current time
  while ((millis() - time) < timeout) {  // Wait for response within timeout period
    if (A9GSerial.available()) {  // If data is available from GSM module
      String response = A9GSerial.readString();  // Read the response
      Serial.println(response);  // Print response to serial monitor
      if (response.indexOf(expectedResponse) != -1) {  // Check if expected response is received
        break;  // Exit loop if expected response is found
      }
    }
  }
}

// Make a Call
void makeCall(String number) {
  sendCommand("ATD" + number + ";", "OK", 5000);  // Send AT command to dial the number
  Serial.println("Calling " + number);  // Print calling status to serial monitor
}

// Send SMS
void sendSMS(String number, String message) {
  sendCommand("AT+CMGF=1", "OK", 1000);  // Set SMS text mode
  A9GSerial.print("AT+CMGS=\"");  // Start SMS command
  A9GSerial.print(number);  // Add recipient number
  A9GSerial.println("\"");  // End recipient number
  delay(2000);  // Wait for GSM module to respond
  A9GSerial.print(message);  // Send SMS message
  delay(2000);  // Wait for GSM module to process
  A9GSerial.write(26);  // Send CTRL+Z to indicate end of message
  delay(5000);  // Wait for SMS to be sent
  Serial.println("SMS Sent!");  // Print SMS sent status to serial monitor
}

// Get GPS Data
String getGPSData() {
  unsigned long startTime = millis();  // Record start time
  while (millis() - startTime < 5000) {  // Wait up to 5 seconds for GPS fix
    while (GPSSerial.available()) {  // If GPS data is available
      gps.encode(GPSSerial.read());  // Parse GPS data
    }

    if (gps.location.isValid()) {  // If GPS data is valid
      return "GPS Data:\nLat: " + String(gps.location.lat(), 6) + "\nLon: " + String(gps.location.lng(), 6) + "\nSpeed: " + String(gps.speed.kmph()) + " km/h";  // Return formatted GPS data
    }
  }
  return "GPS Signal not available!";  // Return error message if GPS data is not available
}

// Get DHT11 Data
String getDHTData() {
  float temperature = dht.readTemperature();  // Read temperature from DHT11
  float humidity = dht.readHumidity();  // Read humidity from DHT11

  if (isnan(temperature) || isnan(humidity)) {  // If sensor reading fails
    return "DHT11 Sensor Error!";  // Return error message
  }

  return "Temperature: " + String(temperature) + " C\nHumidity: " + String(humidity) + " %";  // Return formatted DHT11 data
}

// Check for Incoming SMS
void checkForIncomingSMS() {
  while (A9GSerial.available()) {  // If data is available from GSM module
    String incomingData = A9GSerial.readString();  // Read incoming data
    incomingData.trim();  // Remove extra spaces
    Serial.print("Received: ");  // Print received data to serial monitor
    Serial.println(incomingData);
    
    if (incomingData.indexOf("STOP") != -1) {  // If "STOP" command is received
      Serial.println("STOP Message Received! Stopping Buzzer...");
      smsAlertActive = false;  // Deactivate SMS alert
      digitalWrite(BUZZER_PIN, LOW);  // Turn off buzzer
    } 
    if (incomingData.indexOf("BEEP") != -1) {  // If "BEEP" command is received
      Serial.println("BEEP Message Received! Activating Buzzer Alert...");
      smsAlertActive = true;  // Activate SMS alert
    }
  }
}