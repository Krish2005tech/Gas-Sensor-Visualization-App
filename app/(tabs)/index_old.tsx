import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Button, Platform } from "react-native";
import { LineChart } from "react-native-chart-kit";
import * as DocumentPicker from "expo-document-picker";
import { readString } from "react-native-csv";
import { Appbar, Card } from "react-native-paper";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Image } from 'react-native';

export default function HomeScreen() {
  const [dataPoints1, setDataPoints1] = useState<number[]>([]);
  const [dataPoints2, setDataPoints2] = useState<number[]>([]);
  const [dataPoints3, setDataPoints3] = useState<number[]>([]);
  const [dataPoints4, setDataPoints4] = useState<number[]>([]);
  const [dataPoints5, setDataPoints5] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [index, setIndex] = useState(0);

  const [paused, setPaused] = useState(false);

  const [voltage,setVoltage] = useState(0);
  const [rawValue,setRawValue] = useState(0);

  const [liveData, setLiveData] = useState(true);
  const [value1, setValue1] = useState(0);
  const [value2, setValue2] = useState(0);
  const [value3, setValue3] = useState(0);
  const [value4, setValue4] = useState(0);
  const [value5, setValue5] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);

  const viewLast = 2000;
  const interval_live = React.useRef<any>(null);
  const interval = React.useRef<any>(null);

  const app_url = "YOUR_CLOUD_URL_HERE"; // Replace with your actual cloud URL

  useEffect(() => {
    if (csvData.length > 0) {
      interval.current = setInterval(() => {
        if (index < csvData.length) {
          const newValue1 = parseFloat(csvData[index].reading1);
          const newValue2 = parseFloat(csvData[index].reading2);
          const newValue3 = parseFloat(csvData[index].reading3);
          const newValue4 = parseFloat(csvData[index].reading4);
          // const newValue5 = parseFloat(csvData[index].reading5);


          // newValue1 = (newValue1*(3.3))/4096;

          // const newTemperature = parseFloat(csvData[index].temperature);
          // const newHumidity = parseFloat(csvData[index].humidity);
          if (Number.isNaN(newValue1) || Number.isNaN(newValue2) || Number.isNaN(newValue3) || Number.isNaN(newValue4) ) {
            clearInterval(interval.current);
          } else {
            setDataPoints1((prev) => [...prev.slice(-(viewLast - 1)), newValue1]);
            setDataPoints2((prev) => [...prev.slice(-(viewLast - 1)), newValue2]);
            setDataPoints3((prev) => [...prev.slice(-(viewLast - 1)), newValue3]);
            setDataPoints4((prev) => [...prev.slice(-(viewLast - 1)), newValue4]);
            // setDataPoints5((prev) => [...prev.slice(-(viewLast - 1)), newValue5]);
            setTimestamps((prev) => [...prev.slice(-(viewLast - 1)), parseFloat(csvData[index].time).toFixed(3)]);
            setIndex((prev) => prev + 1);
          }
        } else {
          clearInterval(interval.current);
        }
      }, 1);
      return () => clearInterval(interval.current);
    }
  }, [csvData, index]);

  const pickCSVFile = async () => {
    setLiveData(true);
    clearInterval(interval_live.current);
    clearInterval(interval.current);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "text/csv" });

      if (!result.assets || result.assets.length === 0 || !result.assets[0].uri) {
        console.error("File selection was canceled or invalid URI.");
        return;
      }

      setDataPoints1([]);
      setDataPoints2([]);
      setDataPoints3([]);
      setDataPoints4([]);
      // setDataPoints5([]);
      setTimestamps([]);

      let fileContent = "";
      const fileUri = result.assets[0].uri;

      if (Platform.OS === "web") {
        try {
          const response = await fetch(fileUri);
          if (!response.ok) {
            throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
          }
          fileContent = await response.text();
        } catch (error) {
          console.error("Error fetching file on Web:", error);
          return;
        }
      } else {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
          fileContent = e.target?.result as string;
          processCSVData(fileContent);
        };
        const blob = await (await fetch(fileUri)).blob();
        fileReader.readAsText(blob);
        return;
      }

      processCSVData(fileContent);
    } catch (error) {
      console.error("Error selecting file:", error);
    }
  };

  const processCSVData = (fileContent: string) => {
    readString(fileContent, {
      header: true,
      complete: (parsedData) => {
        if (parsedData.data.length > 0 && parsedData.data[0].time && parsedData.data[0].reading1 && parsedData.data[0].reading2 && parsedData.data[0].reading3 && parsedData.data[0].reading4 && parsedData.data[0].reading5) {
          setCsvData(parsedData.data);
          setIndex(0);
          setDataPoints1([]);
          setDataPoints2([]);
          setDataPoints3([]);
          setDataPoints4([]);
          // setDataPoints5([]);
          setTimestamps([]);
        }
      },
    });
  };

  const viewLastLive = 300;

  const fetchData = async () => {
    try {
      // const response = await fetch("http://10.115.139.170:8080/json", {    
      const response = await fetch("http://192.168.159.254/json", {       
        method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*", 
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      // const newValue1 = parseFloat(((json.value1*(3.3))/4096).toFixed(3)); // the response format is { "value1": 10, "value2": 20, ... }
      //  const newValue2 = parseFloat(((json.value2*(3.3))/4096).toFixed(3));
      //  const newValue3 = parseFloat(((json.value3*(3.3))/4096).toFixed(3));
      // const newValue4 =parseFloat(((json.value4*(3.3))/4096).toFixed(3));
    //  const newValue5 =parseFloat(((json.value5*(3.3))/4096).toFixed(3));

      // const newValue1 = json.value1; // the response format is { "value1": 10, "value2": 20, ... }
      // const newValue2 = json.value2;
      // const newValue3 = json.value3;
      // const newValue4 = json.value4;
      // const newValue5 = json.value5*3.3/4096;

      const newVoltage = json.value1;
      const rawValue = json.rawValue;


      // const newTemperature = json.temperature;
      // const newHumidity = json.humidity;

      // console.log("New Values:", newValue1, newValue2, newValue3, newValue4);

      setVoltage(newVoltage);
      setRawValue(rawValue);

      // setValue1(newValue1);
      // setValue2(newValue2);
      // setValue3(newValue3);
      // setValue4(newValue4);
      // setValue5(newValue5);

      // setTemperature(newTemperature);
      // setHumidity(newHumidity);

      setDataPoints1((prev) => [...prev.slice(-(viewLastLive - 1)), newVoltage]);
      // setDataPoints2((prev) => [...prev.slice(-(viewLastLive - 1)), newValue2]);
      // setDataPoints3((prev) => [...prev.slice(-(viewLastLive - 1)), newValue3]);
      // setDataPoints4((prev) => [...prev.slice(-(viewLastLive - 1)), newValue4]);
      // setDataPoints5((prev) => [...prev.slice(-(viewLastLive - 1)), newValue5]);
      setTimestamps((prev) => [...prev.slice(-(viewLastLive - 1)), new Date().toLocaleTimeString()]);
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  const getMessage = () => {
    if (value1 < 10) return "Low Value";
    if (value1 < 20) return "Normal Value";
    return "High Value";
  };

  const guardarArchivo = async (file) => {
    try {
      const response = await fetch(file.assets[0].uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.readAsDataURL(blob);
      reader.onload = function () {
        const rawLog = reader.result.split(',')[1];

        const dataSend = {
          dataReq: {
            data: rawLog,
            name: file.assets[0].name,
            type: file.assets[0].mimeType,
          },
          fname: 'uploadFilesToGoogleDrive',
        };

        fetch(app_url, {
          method: 'POST',
          body: JSON.stringify(dataSend),
        })
          .then((response) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
              return response.json();
            } else {
              return response.text().then((text) => {
                throw new Error(text);
              });
            }
          })
          .then((data) => {
            console.log(data);
          })
          .catch((error) => {
            console.error('Error:', error.message);
          });
      };
    } catch (error) {
      console.error('Error processing file:', error);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
      });

      if (result.canceled) return;
      console.log('Selected file:', result.assets[0].uri);
      guardarArchivo(result);
    } catch (error) {
      console.error('Error picking file:', error);
    }
  };

  async function dumpToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "time,Sensor1,Sensor2,Sensor3,Sensor4,Sensor5\n";
    for (let i = 0; i < dataPoints1.length; i++) {
      csvContent += `${timestamps[i]},${dataPoints1[i]},${dataPoints2[i]},${dataPoints3[i]},${dataPoints4[i]}}\n`;
    }
    const date = new Date().toISOString().slice(0, 10);
    const file_name = `data_${date}.csv`;

    const fileUri = FileSystem.documentDirectory + file_name;
    // guardarArchivo(fileUri);


    if (Platform.OS === 'web') {
      // Web-specific implementation
      const encodedUri = encodeURI(csvContent);
      // guardarArchivo(encodedUri);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', file_name);
      document.body.appendChild(link);
      link.click();
    } else {


    try {
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      // Open the share dialog so the user can download the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        console.log('File shared successfully');
        // guardarArchivo(fileUri);
      } else {
        console.log('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error writing file:', error);
    }
  }



}

  const liveESPdata = () => {
    setLiveData(false);
    clearInterval(interval_live.current);
    clearInterval(interval.current);
    setDataPoints1([]);
    setDataPoints2([]);
    setDataPoints3([]);
    setDataPoints4([]);
    // setDataPoints5([]);
    setTimestamps([]);
    interval_live.current = setInterval(fetchData, 1000);
  }

  const stopLiveFeed = () => {
    setLiveData(true);
    clearInterval(interval_live.current);
    dumpToCSV();
  }

  const pauseLiveFeed = () => {
    setLiveData(true);
    clearInterval(interval_live.current);
    clearInterval(interval.current);
    setPaused(true);
  }

  const resumeLiveFeed = () => {
    setLiveData(false);
    clearInterval(interval_live.current);
    interval_live.current = setInterval(fetchData, 1000);
    setPaused(false);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      <Appbar.Header
      style={{minHeight:"max-content",margin:10}}>
        {/* Add logo on the left */}
        {/* <Appbar.Action 
          icon={() => ( */}
            <Image 
              source={require('./Design-of-New-Logo-of-IITJ-2.png')} // Fixed path syntax
              style={{ width: 45, height: 50,marginTop: 5,alignSelf:"left" }}
            />
        <Appbar.Content title="Gas Sensor Visualization App" style={{alignSelf:"center",maxWidth:"90%", flexWrap: "wrap"}} />
      </Appbar.Header>
  
      {liveData ?
        <Button title="Get Live Data" onPress={liveESPdata} /> :
        <Card style={{ padding: 1 }}>
          {paused?<Button title="Pause Live Feed" onPress={pauseLiveFeed} />
          :<Button title="Resume Live Feed" onPress={resumeLiveFeed} />}
          <Button title="Stop Live Feed" onPress={stopLiveFeed} />
          <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center" }}>
            Raw Value : {rawValue} , Voltage : {voltage} V
          </Text>
        </Card>
      }
      <Button title="Plot CSV File" onPress={pickCSVFile} />
      <Button title="Upload CSV File to cloud" onPress={pickFile} />
  
      <ScrollView contentContainerStyle={{ padding: 16, marginTop: 120, alignSelf: "center", flexGrow: 1 }} horizontal>
        {dataPoints1.length > 1 && (
          <LineChart
            data={{
              labels: !liveData ? timestamps : [],
              datasets: [
                { data: dataPoints1, color: (opacity = 0) => `rgba(255, 0, 0, ${opacity})` },
              ],
            }}
            width={700}
            height={520}
            yAxisSuffix=" V"
            yLabelsOffset={10} 
            chartConfig={{
              backgroundGradientFrom: "#1E2923",
              backgroundGradientFromOpacity: 0,
              backgroundGradientTo: "#08130D",
              backgroundGradientToOpacity: 0.0,
              decimalPlaces: 2,
              color: (opacity = 0) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForVerticalLabels: {
                rotation: 270,
              },
            }}
            style={{ marginVertical: 8,borderRadius: 20, alignSelf: "center", paddingTop: 20,borderWidth: 5, borderColor: "#000" }}
            bezier
          />
        )}
      </ScrollView>
      {dataPoints1.length > 1 ? <Text style={{ alignSelf: "center", marginTop: 5, fontSize: 14, fontWeight: "bold" }}>Time</Text>:<></>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});