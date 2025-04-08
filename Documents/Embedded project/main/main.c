#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "driver/gpio.h"
#include "driver/uart.h"
#include "esp_log.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "esp_http_client.h"
#include "dht.h"

extern const uint8_t firebase_cert_pem_start[] asm("_binary_firebase_cert_pem_start");
extern const uint8_t firebase_cert_pem_end[]   asm("_binary_firebase_cert_pem_end");

#define FIREBASE_HOST         "https://test-45e79-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH         "?auth=AIzaSyD73d45or5ZbIYssUd6dtURAwI4IJDyur8"
#define WIFI_SSID             "SasinduAmesh"
#define WIFI_PASSWORD         "12345678"
#define DHT_TYPE              DHT_TYPE_DHT11
#define DHT_PIN               GPIO_NUM_21
#define UART_GPS              UART_NUM_1
#define UART_A9               UART_NUM_2
#define BUF_SIZE              1024
#define BUTTON_GPIO           GPIO_NUM_4
#define BUZZER_GPIO           GPIO_NUM_5

static const char *TAG = "EMERGENCY_SYSTEM";
static EventGroupHandle_t wifi_event_group;
const int CONNECTED_BIT = BIT0;
static double lat_dd = 0.0, lon_dd = 0.0;
static float speed_kmph = 0.0;
static int16_t temperature = 0, humidity = 0;
volatile bool emergency = false;

static void wifi_event_handler(void* arg, esp_event_base_t event_base, int32_t event_id, void* event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        esp_wifi_connect();
        xEventGroupClearBits(wifi_event_group, CONNECTED_BIT);
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        xEventGroupSetBits(wifi_event_group, CONNECTED_BIT);
    }
}

void wifi_init_sta(void) {
    wifi_event_group = xEventGroupCreate();
    esp_netif_init();
    esp_event_loop_create_default();
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);

    esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL);
    esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL);

    wifi_config_t wifi_config = {};
    strlcpy((char *)wifi_config.sta.ssid, WIFI_SSID, sizeof(wifi_config.sta.ssid));
    strlcpy((char *)wifi_config.sta.password, WIFI_PASSWORD, sizeof(wifi_config.sta.password));
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    esp_wifi_set_mode(WIFI_MODE_STA);
    esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    esp_wifi_start();
}

void init_gpio() {
    gpio_set_direction(BUTTON_GPIO, GPIO_MODE_INPUT);
    gpio_set_pull_mode(BUTTON_GPIO, GPIO_PULLUP_ONLY);
    gpio_set_direction(BUZZER_GPIO, GPIO_MODE_OUTPUT);
    gpio_set_level(BUZZER_GPIO, 0);
}

void init_uart() {
    uart_config_t gps_uart_conf = {
        .baud_rate = 9600,
        .data_bits = UART_DATA_8_BITS,
        .parity    = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE
    };
    uart_driver_install(UART_GPS, BUF_SIZE * 2, 0, 0, NULL, 0);
    uart_param_config(UART_GPS, &gps_uart_conf);
    uart_set_pin(UART_GPS, GPIO_NUM_18, GPIO_NUM_19, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE);

    uart_config_t a9_uart_conf = {
        .baud_rate = 115200,
        .data_bits = UART_DATA_8_BITS,
        .parity    = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE
    };
    uart_driver_install(UART_A9, BUF_SIZE * 2, 0, 0, NULL, 0);
    uart_param_config(UART_A9, &a9_uart_conf);
    uart_set_pin(UART_A9, GPIO_NUM_17, GPIO_NUM_16, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE);
}

void read_a9_response() {
    uint8_t buf[BUF_SIZE];
    int len = uart_read_bytes(UART_A9, buf, BUF_SIZE - 1, 1000 / portTICK_PERIOD_MS);
    if (len > 0) {
        buf[len] = '\0';
        ESP_LOGI(TAG, "A9 Response: %s", (char *)buf);
    }
}

void a9_gsm_init() {
    const char *cmds[] = { "ATE0\r\n", "AT\r\n", "AT+CSQ\r\n", "AT+CREG?\r\n", "AT+CMGF=1\r\n" };
    for (int i = 0; i < sizeof(cmds) / sizeof(cmds[0]); i++) {
        uart_write_bytes(UART_A9, cmds[i], strlen(cmds[i]));
        vTaskDelay(pdMS_TO_TICKS(1000));
        read_a9_response();
    }
}

static esp_err_t http_event_handler(esp_http_client_event_t *evt) {
    return ESP_OK;
}

esp_err_t update_firebase(const char *path, const char *json_data) {
    char url[256];
    snprintf(url, sizeof(url), "%s%s%s", FIREBASE_HOST, path, FIREBASE_AUTH);

    esp_http_client_config_t config = {
        .url = url,
        .method = HTTP_METHOD_PATCH,
        .cert_pem = (const char *)firebase_cert_pem_start,
        .event_handler = http_event_handler,
        .skip_cert_common_name_check = true,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_post_field(client, json_data, strlen(json_data));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "Firebase Updated: %s => %s", path, json_data);
    } else {
        ESP_LOGE(TAG, "Firebase update failed: %s", esp_err_to_name(err));
    }

    esp_http_client_cleanup(client);
    return err;
}

bool fetch_emergency_status() {
    char url[256];
    snprintf(url, sizeof(url), "%s/Emergency.json%s", FIREBASE_HOST, FIREBASE_AUTH);

    esp_http_client_config_t config = {
        .url = url,
        .cert_pem = (const char *)firebase_cert_pem_start,
        .event_handler = http_event_handler,
        .skip_cert_common_name_check = true,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_method(client, HTTP_METHOD_GET);
    esp_http_client_set_header(client, "Content-Type", "application/json");

    esp_err_t err = esp_http_client_open(client, 0);
    bool new_status = emergency;

    if (err == ESP_OK) {
        int content_length = esp_http_client_fetch_headers(client);
        ESP_LOGI(TAG, "Content Length: %d", content_length);

        char buffer[64] = {0};
        int read_len = esp_http_client_read(client, buffer, sizeof(buffer) - 1);
        if (read_len >= 0) {
            buffer[read_len] = '\0';
            ESP_LOGI(TAG, "Firebase Raw: '%s'", buffer);

            // Strip whitespace/newlines
            for (int i = 0; i < read_len; i++) {
                if (buffer[i] == '\n' || buffer[i] == '\r' || buffer[i] == ' ') {
                    buffer[i] = '\0';
                    break;
                }
            }

            if (strcmp(buffer, "true") == 0) {
                new_status = true;
            } else if (strcmp(buffer, "false") == 0) {
                new_status = false;
            } else {
                ESP_LOGW(TAG, "Unrecognized response: '%s'", buffer);
            }
        } else {
            ESP_LOGE(TAG, "Failed to read Firebase response");
        }
    } else {
        ESP_LOGE(TAG, "Failed to open connection: %s", esp_err_to_name(err));
    }

    esp_http_client_cleanup(client);
    return new_status;
}


void firebase_task(void *pvParameters) {
    xEventGroupWaitBits(wifi_event_group, CONNECTED_BIT, false, true, portMAX_DELAY);

    uint8_t gps_buf[BUF_SIZE];

    while (1) {
        if (dht_read_data(DHT_TYPE, DHT_PIN, &humidity, &temperature) != ESP_OK) {
            ESP_LOGW(TAG, "DHT read failed");
        }

        int len = uart_read_bytes(UART_GPS, gps_buf, BUF_SIZE - 1, 1000 / portTICK_PERIOD_MS);
        if (len > 0) {
            gps_buf[len] = '\0';
            char *gpgga = strstr((char *)gps_buf, "$GPGGA");
            if (gpgga) {
                char *token = strtok(gpgga, ",");
                int field = 0;
                char *lat_str = NULL, *lat_dir = NULL;
                char *lon_str = NULL, *lon_dir = NULL;

                while (token != NULL) {
                    field++;
                    if (field == 3) lat_str = token;
                    if (field == 4) lat_dir = token;
                    if (field == 5) lon_str = token;
                    if (field == 6) lon_dir = token;
                    token = strtok(NULL, ",");
                }

                if (lat_str && lat_dir && lon_str && lon_dir) {
                    double lat_raw = atof(lat_str);
                    double lon_raw = atof(lon_str);
                    int lat_deg = (int)(lat_raw / 100);
                    double lat_min = lat_raw - (lat_deg * 100);
                    lat_dd = lat_deg + (lat_min / 60.0);
                    if (lat_dir[0] == 'S') lat_dd *= -1;

                    int lon_deg = (int)(lon_raw / 100);
                    double lon_min = lon_raw - (lon_deg * 100);
                    lon_dd = lon_deg + (lon_min / 60.0);
                    if (lon_dir[0] == 'W') lon_dd *= -1;
                }
            }

            char *gprmc = strstr((char *)gps_buf, "$GPRMC");
            if (gprmc) {
                char *token = strtok(gprmc, ",");
                int field = 0;
                while (token != NULL) {
                    field++;
                    if (field == 8) {
                        speed_kmph = atof(token) * 1.852;
                        break;
                    }
                    token = strtok(NULL, ",");
                }
            }
        }

        char json_dht[100];
        snprintf(json_dht, sizeof(json_dht), "{\"temperature\": %.1f, \"humidity\": %.1f}",
                 temperature / 10.0, humidity / 10.0);
        update_firebase("/DHT.json", json_dht);

        char json_gps[150];
        snprintf(json_gps, sizeof(json_gps), "{\"latitude\": %.5f, \"longitude\": %.5f, \"speed\": %.2f}",
                 lat_dd, lon_dd, speed_kmph);
        update_firebase("/GPS.json", json_gps);

        bool new_emergency = fetch_emergency_status();
        if (new_emergency != emergency) {
            emergency = new_emergency;
            ESP_LOGW(TAG, "Synced from Firebase: Emergency = %s", emergency ? "true" : "false");
        }

        ESP_LOGI(TAG, "Local emergency = %s", emergency ? "true" : "false");

        vTaskDelay(pdMS_TO_TICKS(3000));
    }
}

void emergency_task(void *pvParameters) {
    while (1) {
        if (gpio_get_level(BUTTON_GPIO) == 0) {
            vTaskDelay(pdMS_TO_TICKS(200));
            if (gpio_get_level(BUTTON_GPIO) == 0) {
                emergency = !emergency;

                char alarm_json[32];
                snprintf(alarm_json, sizeof(alarm_json), "{\"Emergency\": %s}", emergency ? "true" : "false");
                update_firebase("/.json", alarm_json);

                if (emergency) {
                    char msg[256];
                    snprintf(msg, sizeof(msg),
                        "EMERGENCY!\nTemp: %.1fC\nHumidity: %.1f%%\nSpeed: %.2f km/h\nLocation:\nhttps://maps.google.com/?q=%.5f,%.5f",
                        temperature / 10.0, humidity / 10.0, speed_kmph, lat_dd, lon_dd);

                    uart_flush(UART_A9);
                    uart_write_bytes(UART_A9, "AT+CMGS=\"+94771620857\"\r\n", 26);
                    vTaskDelay(pdMS_TO_TICKS(5000));
                    uart_write_bytes(UART_A9, msg, strlen(msg));
                    uart_write_bytes(UART_A9, "\x1A", 1);
                    ESP_LOGI(TAG, "Emergency SMS sent");
                    vTaskDelay(pdMS_TO_TICKS(5000));
                    read_a9_response();

                    uart_write_bytes(UART_A9, "ATD+94771620857;\r\n", 21);
                    vTaskDelay(pdMS_TO_TICKS(15000));
                    uart_write_bytes(UART_A9, "ATH\r\n", 6);
                }
            }
            vTaskDelay(pdMS_TO_TICKS(1000));
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void buzzer_task(void *pvParameters) {
    while (1) {
        if (emergency) {
            gpio_set_level(BUZZER_GPIO, 1);
            vTaskDelay(pdMS_TO_TICKS(200));
            gpio_set_level(BUZZER_GPIO, 0);
            vTaskDelay(pdMS_TO_TICKS(200));
        } else {
            gpio_set_level(BUZZER_GPIO, 0);
            vTaskDelay(pdMS_TO_TICKS(100));
        }
    }
}

void app_main(void) {
    nvs_flash_init();
    wifi_init_sta();
    init_uart();
    init_gpio();
    a9_gsm_init();

    xTaskCreate(firebase_task, "firebase_task", 8192, NULL, 5, NULL);
    xTaskCreate(emergency_task, "emergency_task", 4096, NULL, 5, NULL);
    xTaskCreate(buzzer_task, "buzzer_task", 2048, NULL, 4, NULL);
}
