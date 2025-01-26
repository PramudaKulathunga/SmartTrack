# **SmartTrack**
### IoT Vehicle Monitoring and Control System for Rent-a-Car Service Owners  

---

## 📖 **Introduction**  
SmartTrack is an IoT-based solution tailored for rent-a-car businesses to improve **safety**, **accountability**, and **vehicle control**. The system integrates:  
- **ESP32-powered hardware modules** installed in vehicles.  
- A **dual-panel mobile app** for owners and drivers.  
- A **project portfolio website** for documentation.  

#### 🚩 **Key Features**  
✅ **Speed Monitoring**: Ensures safe driving practices.  
✅ **Fire Detection**: Alerts during emergencies.  
✅ **GPS Tracking**: Real-time location updates.  
✅ **Parking Management**: Simplifies organization of parked vehicles.   

---

## ⚙️ **Circuit Design**  
![Circuit Diagram](https://i.ibb.co/xmFPGhY/image.png)  

The circuit integrates various modules and components to provide seamless monitoring and control. Key design features include:  

- **A9G Module and DHT11**: Connected to the ESP32 via **UART** for GPS, GSM, and temperature sensing functionalities.  
- **Cellular Network**: Communication with the ESP32 via **MQTT protocol** for real-time data transfer.  
- **Alert Signals**:  
  - **Buzzer** and **LEDs** are connected to **ESP32 GPIO pins** to provide visual and audible alerts.  
- **Mobile App Communication**: Enabled through the **cellular network**, ensuring connectivity between the vehicle and the user interface.  

---

## 💻 **Technologies Used**  

### 🛠️ **Tools**  
✅ **RX-TX Protocol**  
✅ **MQTT Protocol**  
✅ **Arduino Cloud Service**  
✅ **Visual Studio Code**  

### 🔧 **Framework**  
✅ **React Native**  

### 🔌 **Hardware**  
✅ **ESP32 Dev Module**  
✅ **DHT11 Temperature Sensor**  
✅ **A9G GPS GSM GPRS Development Module**  
✅ **TP4056 Charging Module**  
✅ **12V Buzzer**  
✅ **Push Button**  

---

## 📚 **References**  
- *(https://docs.ai-thinker.com/en/gprs/a9g/boards)*  
- *(https://www.espressif.com/en/products/socs/esp32)*  
---

## 👥 **Team**  
| **Name**                  | **Index Number** |  
|---------------------------|------------------|  
| DHARMADASA H.M.D.S.       | 2021/E/046       |  
| KULATHUNGA K.M.P.S.       | 2021/E/078       |  
| CHANDRASIRI P.G.P.M.      | 2021/E/108       |  
| BANDARA H.M.S.A.          | 2021/E/187       |  

---

## 🌟 **Future Improvements**  
- *project portfolio website with payment method*  
