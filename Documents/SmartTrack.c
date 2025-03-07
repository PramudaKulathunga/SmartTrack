#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "driver/gpio.h"
#include "driver/uart.h"
#include "esp_log.h"
#include "esp_system.h"
#include "esp_err.h"
#include "esp_timer.h"
#include "driver/adc.h"
#include "esp_intr_alloc.h"
#include "esp32/rom/uart.h"
#include "esp_log.h"
#include "DHT.h"

// Define the pins
#define A9G_RX_PIN 16    // ESP32 GPIO to A9G TX
#define A9G_TX_PIN 17    // ESP32 GPIO to A9G RX
#define GPS_RX_PIN 18    // ESP32 GPIO to GPS TX
#define GPS_TX_PIN 19    // ESP32 GPIO to GPS RX
#define BUTTON_PIN 21    // GPIO for the push button
#define BUZZER_PIN 22    // GPIO for the buzzer
#define DHT_PIN 4        // GPIO for DHT11 sensor
#define DHT_TYPE DHT11

// Hardware Serial Ports
#define UART_NUM_1      1
#define UART_NUM_2      2

// Initialize UART settings
#define BAUD_RATE       115200
#define GPS_BAUD_RATE   9600

// DHT
DHT dht(DHT_PIN, DHT_TYPE);

// Global variables for GSM and GPS
char phoneNumber[] = "+94771620857";
bool buzzerActive = false;
bool smsAlertActive = false;

void initGSM();
void sendCommand(char* command, char* expectedResponse, int timeout);
void makeCall(char* number);
void sendSMS(char* number, char* message);
char* getGPSData();
char* getDHTData();
void checkForIncomingSMS();

// Set up the UART communication for GSM and GPS
void init_uart() {
    uart_config_t uart_config = {
        .baud_rate = BAUD_RATE,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE
    };
    uart_param_config(UART_NUM_1, &uart_config);
    uart_set_pin(UART_NUM_1, A9G_TX_PIN, A9G_RX_PIN, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE);
    uart_driver_install(UART_NUM_1, 1024, 0, 0, NULL, 0);
    
    uart_config_t gps_uart_config = {
        .baud_rate = GPS_BAUD_RATE,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE
    };
    uart_param_config(UART_NUM_2, &gps_uart_config);
    uart_set_pin(UART_NUM_2, GPS_TX_PIN, GPS_RX_PIN, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE);
    uart_driver_install(UART_NUM_2, 1024, 0, 0, NULL, 0);
}

// Send AT commands to GSM module
void sendCommand(char* command, char* expectedResponse, int timeout) {
    uart_write_bytes(UART_NUM_1, command, strlen(command));
    vTaskDelay(timeout / portTICK_PERIOD_MS);
    uint8_t data[128];
    int len = uart_read_bytes(UART_NUM_1, data, sizeof(data), timeout / portTICK_PERIOD_MS);
    if (len > 0) {
        data[len] = '\0'; // Null terminate the string
        ESP_LOGI("UART", "Response: %s", data);
    }
}

// Make a phone call
void makeCall(char* number) {
    char command[100];
    snprintf(command, sizeof(command), "ATD%s;", number);
    sendCommand(command, "OK", 5000);
    ESP_LOGI("GSM", "Calling %s", number);
}

// Send SMS to a number
void sendSMS(char* number, char* message) {
    sendCommand("AT+CMGF=1", "OK", 1000);
    char command[200];
    snprintf(command, sizeof(command), "AT+CMGS=\"%s\"", number);
    uart_write_bytes(UART_NUM_1, command, strlen(command));
    vTaskDelay(2000 / portTICK_PERIOD_MS);
    uart_write_bytes(UART_NUM_1, message, strlen(message));
    uart_write_bytes(UART_NUM_1, "\x1A", 1); // Send CTRL+Z to send SMS
    vTaskDelay(5000 / portTICK_PERIOD_MS);
    ESP_LOGI("SMS", "SMS Sent!");
}

// Get GPS data
char* getGPSData() {
    static char gpsData[300];
    int len = uart_read_bytes(UART_NUM_2, gpsData, sizeof(gpsData), 5000 / portTICK_PERIOD_MS);
    if (len > 0) {
        gpsData[len] = '\0'; // Null terminate the string
        ESP_LOGI("GPS", "GPS Data: %s", gpsData);
        return gpsData;
    }
    return "GPS Signal not available!";
}

// Get DHT data
char* getDHTData() {
    static char dhtData[100];
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    
    if (isnan(temperature) || isnan(humidity)) {
        snprintf(dhtData, sizeof(dhtData), "DHT11 Sensor Error!");
    } else {
        snprintf(dhtData, sizeof(dhtData), "Temperature: %.2f C, Humidity: %.2f%%", temperature, humidity);
    }
    
    ESP_LOGI("DHT", "DHT Data: %s", dhtData);
    return dhtData;
}

// Check for incoming SMS and process commands
void checkForIncomingSMS() {
    uint8_t data[128];
    int len = uart_read_bytes(UART_NUM_1, data, sizeof(data), 1000 / portTICK_PERIOD_MS);
    if (len > 0) {
        data[len] = '\0'; // Null terminate the string
        ESP_LOGI("SMS", "Received: %s", data);
        
        if (strstr((char*)data, "STOP") != NULL) {
            ESP_LOGI("SMS", "STOP Message Received! Stopping Buzzer...");
            smsAlertActive = false;
            gpio_set_level(BUZZER_PIN, 0);
        }
        
        if (strstr((char*)data, "BEEP") != NULL) {
            ESP_LOGI("SMS", "BEEP Message Received! Activating Buzzer Alert...");
            smsAlertActive = true;
        }
    }
}

void app_main(void) {
    // Initialize GPIO for button and buzzer
    gpio_set_direction(BUTTON_PIN, GPIO_MODE_INPUT);
    gpio_set_pull_mode(BUTTON_PIN, GPIO_PULLUP_ONLY);
    gpio_set_direction(BUZZER_PIN, GPIO_MODE_OUTPUT);

    // Initialize the UART and DHT sensor
    init_uart();
    dht.begin();

    while (1) {
        // Check if the button is pressed
        if (gpio_get_level(BUTTON_PIN) == 0) {
            vTaskDelay(200 / portTICK_PERIOD_MS); // Debounce
            buzzerActive = !buzzerActive;

            if (buzzerActive) {
                ESP_LOGI("Button", "Button Pressed! Making a call and sending SMS...");
                makeCall(phoneNumber);
                vTaskDelay(10000 / portTICK_PERIOD_MS); // Wait before sending SMS
                char* gpsMessage = getGPSData();
                char* dhtMessage = getDHTData();
                sendSMS(phoneNumber, gpsMessage);
                sendSMS(phoneNumber, dhtMessage);
            } else {
                ESP_LOGI("Button", "Button Pressed Again! Stopping buzzer...");
                gpio_set_level(BUZZER_PIN, 0); // Stop buzzer
            }

            vTaskDelay(500 / portTICK_PERIOD_MS); // Prevent multiple triggers
        }

        // Blink buzzer if active (Emergency mode OR SMS Alert)
        if (buzzerActive || smsAlertActive) {
            gpio_set_level(BUZZER_PIN, 1);
            vTaskDelay(500 / portTICK_PERIOD_MS);
            gpio_set_level(BUZZER_PIN, 0);
            vTaskDelay(500 / portTICK_PERIOD_MS);
        }

        // Check for incoming SMS
        checkForIncomingSMS();
    }
}