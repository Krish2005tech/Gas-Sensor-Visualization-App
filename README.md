# Gas Sensor Visualization App

A cross-platform mobile application built with React Native and Expo for real-time visualization of gas sensor data.

<!-- ![Gas Sensor Visualization App](https://via.placeholder.com/800x400?text=Gas+Sensor+Visualization+App) -->

## 📱 Overview

This application was developed to interface with ESP32-based gas sensors, providing real-time visualization and data collection capabilities. The app is designed for researchers and engineers who need to observe different sensor responses, identify gas types based on signature patterns, and store sensor data for later analysis.

## ✨ Key Features

- **Real-time visualization** of sensor data from ESP32 devices
- **Live data controls** - pause, resume, and stop data collection
- **Automatic CSV export** when stopping live data collection
- **CSV file plotting** for analyzing previously collected data
- **Cloud storage integration** for uploading CSV files to Google Cloud
- **Dynamic color-coded graphs** for better data visualization
- **Scrollable plots** optimized for mobile device screens
- **Variable sensor input handling** - works with any number of sensors
- **Cross-platform compatibility** (iOS, Android, Web) using React Native

## 🔧 Technical Architecture

The application:
- Fetches real-time sensor data from ESP32 devices via HTTP requests
- Renders interactive line charts using `react-native-chart-kit`
- Manages file operations with Expo's document picker and file system APIs
- Provides cloud storage integration for data archiving and sharing

## 📋 Prerequisites

Before running this project, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)
- [Expo Go](https://expo.dev/go) app on your mobile device (for testing)

## 🚀 Installation & Setup

1. Clone the repository
   ```bash
   git clone https://github.com/Krish2005tech/Gas-Sensor-Visualization-App.git
   cd gas-sensor-visualization-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure the ESP32 connection
   - Open `index.tsx` and update the `esp_url` constant with your ESP32's IP address:
     ```javascript
     const esp_url = "http://YOUR_ESP32_IP_ADDRESS/json";
     ```

4. Set up Google Cloud Storage (recommended)
   - Create a Google drive Folder , make it public and get the Folder ID
   - Go to https://developers.google.com/apps-script and create a new project
   - In that copy-paste the following code and replace the folder id:
   ```javascript
   function doPost(request) {
      var output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JSON);

      try {
         var data = JSON.parse(request.postData.contents);
         var fname = data.fname || "";
         var response = { status: "Function not found: " + fname };

         if (fname === "uploadFilesToGoogleDrive") {
         response = uploadFilesToGoogleDrive(data.dataReq.data, data.dataReq.name, data.dataReq.type);
         }

         output.setContent(JSON.stringify(response));
      } catch (e) {
         output.setContent(JSON.stringify({ status: "Error", message: e.toString() }));
      }

      // Enable CORS headers
      return output
         .setHeader("Access-Control-Allow-Origin", "*")
         .setHeader("Access-Control-Allow-Methods", "POST")
         .setHeader("Access-Control-Allow-Headers", "Content-Type");
   }

   function doGet(e) {
      return ContentService.createTextOutput("")
         .setMimeType(ContentService.MimeType.JSON)
         .setHeader("Access-Control-Allow-Origin", "*")
         .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
         .setHeader("Access-Control-Allow-Headers", "Content-Type");
   }

   function uploadFilesToGoogleDrive(data, name, type) {
      var datafile = Utilities.base64Decode(data)  // convert to Binary (from Base4) Utilities is native from AppsScript
      var blob = Utilities.newBlob(datafile, type, name); // structure the file
      var folder = DriveApp.getFolderById("Folder_id"); //select folder to save
      var newFile = folder.createFile(blob); // create and save
      newFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.EDIT); // set permision to anyone to view
      var url = newFile.getUrl() //get the file URL to share
      var id = newFile.getId()
      let obj = { url, id } //prepare object to response
      return obj
   }
```

   ```
   - Click on the Deploy button and select "New deployment"
   - Select "Web app" and set the access to "Anyone"
   - Click "Deploy" and authorize the app
   - Copy the Web App URL and then create a new .env file in the (tabs) directory of the project and add the following line:
   ```bash
   APP_URL="YOUR_WEB_APP_URL"
   ```


5. Start the development server
   ```bash
   npx expo start
   ```

5. Launch the app
   - Scan the QR code using the Expo Go app on your mobile device
   - Press 'a' in the terminal to open on Android emulator
   - Press 'i' in the terminal to open on iOS simulator
   - Press 'w' in the terminal to open in a web browser

## 📊 Using the App

### Live Data Collection

1. Tap the "Get Live Data" button to start fetching real-time data from your ESP32
2. Use the "Pause Live Feed" button to temporarily halt data collection
3. Use the "Resume Live Feed" button to continue data collection
4. Tap "Stop Live Feed" to end data collection and automatically export the data to a CSV file

### Working with CSV Files

1. Tap "Plot CSV File" to select and visualize data from a previously saved CSV file
2. Tap "Upload CSV File to cloud" to select a CSV file and upload it to your Google Cloud storage

### Interacting with Charts

- Scroll horizontally to view more data points on the timeline
- Tap on data points to view specific values
<!-- - Multiple sensor readings are displayed in different colors for easy differentiation -->

## 📁 File Structure

```
gas-sensor-visualization-app/
├── app/                  # Main application directory
├───── /(tabs)/index.tsx  # Main application component
├── app-example/          # Example application code
├── assets/               # Images and other static assets
├── package.json          # Project dependencies
└── README.md             # Project documentation (this file)
```

## 🔄 Data Format

The app expects the ESP32 to return JSON data in formats:

1. Array format:
   ```json
   {
     "values": [1.234, 2.345, 3.456]
   }
   ```



## 📝 Notes for Developers

- The application handles variable numbers of sensors dynamically
- All data visualization is handled by the `LineChart` component from `react-native-chart-kit`
- CSV files are automatically formatted with timestamps and sensor values
- Error handling is implemented for network requests and file operations

## 📱 Compatibility

- iOS 11+
- Android 5.0+
- Web browsers (modern)

## 🛠️ Troubleshooting

- If you're having trouble connecting to your ESP32, ensure it's on the same network and check the IP address
- For file access issues, ensure your app has the necessary permissions on your device
- If charts aren't displaying correctly, check that your sensor data is in the expected format

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
