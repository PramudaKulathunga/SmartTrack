idf_component_register(SRCS "main.c"
                       INCLUDE_DIRS "."
                       REQUIRES dht esp_wifi nvs_flash esp_idf_lib_helpers esp_timer esp_http_client json
                       EMBED_TXTFILES firebase_cert.pem)
