import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Button, Platform } from "react-native";
import { LineChart } from "react-native-chart-kit";
import * as DocumentPicker from "expo-document-picker";
import { readString } from "react-native-csv";
import { Appbar, Card } from "react-native-paper";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Image } from 'react-native';
import { APP_URL } from "@env";

export default function HomeScreen() {
  const [dataSeries, setDataSeries] = useState<{ [key: string]: number[] }>({});
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liveData, setLiveData] = useState(true);
  const [currentValues, setCurrentValues] = useState<{ [key: string]: number }>({});
  const [seriesHeaders, setSeriesHeaders] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState(null);
  
  const viewLast = 2000;
  const viewLastLive = 300;
  const interval_live = useRef<any>(null);
  const interval = useRef<any>(null);

  const esp_url="http://192.168.116.254/json" // ESP32 IP address
  // const esp_url="http://localhost:3000/"

  const app_url = APP_URL;

  // Function to initialize or reset data series
  const resetDataSeries = (headers: string[]) => {
    const newDataSeries: { [key: string]: number[] } = {};
    const newCurrentValues: { [key: string]: number } = {};
    
    headers.forEach(header => {
      if (header !== 'time' && header !== 'timestamp') {
        newDataSeries[header] = [];
        newCurrentValues[header] = 0;
      }
    });
    
    if (Object.keys(newDataSeries).length > 0) {
      setDataSeries(newDataSeries);
    } else {
      console.error("newDataSeries is empty or invalid:", newDataSeries);
    }
    setCurrentValues(newCurrentValues);
    setSeriesHeaders(headers.filter(h => h !== 'time' && h !== 'timestamp'));
    setTimestamps([]);
  };

  useEffect(() => {
    if (csvData.length > 0 && seriesHeaders.length > 0) {
      interval.current = setInterval(() => {
        if (index < csvData.length) {
          const currentRow = csvData[index];
          let validData = true;
          
          // Check if current row has valid data
          for (const header of seriesHeaders) {
            const value = parseFloat(currentRow[header]);
            if (Number.isNaN(value)) {
              validData = false;
              break;
            }
          }
          
          if (!validData) {
            clearInterval(interval.current);
            return;
          }
          
          // Update each data series
          const newDataSeries = { ...dataSeries };
          const newCurrentValues = { ...currentValues };
          
          for (const header of seriesHeaders) {
            const value = parseFloat(currentRow[header]);
            newDataSeries[header] = [...(newDataSeries[header] || []).slice(-(viewLast - 1)), value];
            newCurrentValues[header] = value;
          }
          
          setDataSeries(newDataSeries);
          setCurrentValues(newCurrentValues);
          
          // Update timestamp
          const timeValue = currentRow.time || currentRow.timestamp;
          const formattedTime = typeof timeValue === 'number' ? 
            parseFloat(timeValue).toFixed(3) : 
            timeValue.toString();
            
          setTimestamps(prev => [...prev.slice(-(viewLast - 1)), formattedTime]);
          setIndex(prev => prev + 1);
        } else {
          clearInterval(interval.current);
        }
      }, 1);
      return () => clearInterval(interval.current);
    }
  }, [csvData, index, seriesHeaders]);
  // }, [csvData]);

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

      // Reset all data series
      setDataSeries({});
      setCurrentValues({});
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
      console.log("File content:", fileContent);
      processCSVData(fileContent);
    } catch (error) {
      console.error("Error selecting file:", error);
    }
  };

  const processCSVData = (fileContent: string) => {
    readString(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (parsedData) => {
        if (parsedData.data.length > 0) {
          // Get all headers
          const headers = parsedData.meta.fields || Object.keys(parsedData.data[0]);

          console.log("Parsed headers:", headers);
          
          // Check if we have time/timestamp and at least one data column
          if ((headers.includes('time') || headers.includes('timestamp')) && headers.length > 1) {
            resetDataSeries(headers);
            setCsvData(parsedData.data);
            setIndex(0);
          } else {
            console.error("CSV must have a time/timestamp column and at least one data column");
          }
        }
      },
    });
  };

  const fetchData = async () => {
    const maxLength = viewLastLive || 10; // fallback default
    try {
      const response = await fetch(esp_url, {
        method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*", 
          "Content-Type": "application/json",
        },
      });
    
      const json = await response.json();
      console.log(json)
    
      if ( Array.isArray(json.values)) {
      // if (json.timestamp !== undefined && Array.isArray(json.values)) {
        // const timestamp = new Date(json.timestamp).toLocaleTimeString();
        // console.log("Timestamp:", timestamp);
        const timestamp = new Date().toLocaleTimeString();
    
        // Update current values
        const newCurrentValues = {};
        json.values.forEach((value, index) => {
          const header = `Sensor${index + 1}`;
          newCurrentValues[header] = value;
        });
        setCurrentValues(prev => ({ ...prev, ...newCurrentValues }));
    
        // Update timestamps
        setTimestamps(prev => [
          ...prev.slice(-(viewLastLive - 1)),
          timestamp,
        ]);
    
        // Update data series using `prev`
        setDataSeries(prev => {
          const updated = { ...prev };
          json.values.forEach((value, index) => {
            const header = `Sensor${index + 1}`;
            updated[header] = [
              ...(updated[header] || []).slice(-(viewLastLive - 1)),
              value,
            ];
          });
          return updated;
        });
      } 
      // Old format handler
      else {
        const timestamp = new Date().toLocaleTimeString();
        const newCurrentValues = {};
        
        setDataSeries(prev => {
          const updated = { ...prev };
          for (const header of seriesHeaders) {
            if (json[header] !== undefined) {
              const value = parseFloat(json[header]);
              if (!Number.isNaN(value)) {
                updated[header] = [
                  ...(updated[header] || []).slice(-(viewLastLive - 1)),
                  value,
                ];
                newCurrentValues[header] = value;
              }
            }
          }
          return updated;
        });
    
        setCurrentValues(prev => ({ ...prev, ...newCurrentValues }));
        setTimestamps(prev => [...prev.slice(-(viewLastLive - 1)), timestamp]);
      }
    
    } catch (error) {
      console.error("Fetch error:", error);
    }
    
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
    
    // Create header row
    csvContent += ["time", ...seriesHeaders].join(",") + "\n";
    
    // Find the longest series length
    const maxLength = Math.max(
      timestamps.length,
      ...seriesHeaders.map(header => dataSeries[header]?.length || 0)
    );
    
    // Create data rows
    for (let i = 0; i < maxLength; i++) {
      let row = timestamps[i] || "";
      
      for (const header of seriesHeaders) {
        row += `,${dataSeries[header]?.[i] || ""}`;
      }
      
      csvContent += row + "\n";
    }
    
    const date = new Date().toISOString().slice(0, 10);
    const file_name = `data_${date}.csv`;
    const fileUri = FileSystem.documentDirectory + file_name;

    if (Platform.OS === 'web') {
      // Web-specific implementation
      const encodedUri = encodeURI(csvContent);
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
        } else {
          console.log('Sharing is not available on this device');
        }
      } catch (error) {
        console.error('Error writing file:', error);
      }
    }
  }


  const fetchAndResetHeaders = async () => {
    try {
      const response = await fetch(esp_url, {
        method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*", 
          "Content-Type": "application/json",
        },
      });
  
      const json = await response.json();
      let temp_headers: string[] = [];
  
      if (json.timestamp !== undefined && Array.isArray(json.values)) {
        temp_headers = json.values.map((_, index) => `Sensor${index + 1}`);
        temp_headers.push("timestamp");
  
        console.log("temp_headers", temp_headers);
        resetDataSeries(temp_headers);
      } else {
        console.error("Invalid format received:", json);
      }
    } catch (error) {
      console.error("Failed to fetch headers:", error);
    }
  };
  

  const liveESPdata = () => {
    setLiveData(false);
    clearInterval(interval_live.current);
    clearInterval(interval.current);
    setDataSeries({});
    setCurrentValues({});
    setTimestamps([]);
    fetchAndResetHeaders();




    interval_live.current = setInterval(fetchData, 1000);
    // resetDataSeries('timestamp'+seriesHeaders); 
  }

  const stopLiveFeed = () => {
    setLiveData(true);
    clearInterval(interval_live.current);
    dumpToCSV();
  }

  const pauseLiveFeed = () => {
    // setLiveData(true);
    clearInterval(interval_live.current);
    // clearInterval(interval.current);
    setPaused(true);
  }

  const resumeLiveFeed = () => {
    // setLiveData(false);
    clearInterval(interval_live.current);
    interval_live.current = setInterval(fetchData, 1000);
    setPaused(false);
  }

  // Generate dynamic colors for the line chart
  const getColorForIndex = (index: number, opacity = 1) => {
    const colors = [
      `rgba(255, 0, 0, ${opacity})`,    // Red
      `rgba(0, 0, 255, ${opacity})`,    // Blue
      `rgba(0, 128, 0, ${opacity})`,    // Green
      `rgba(255, 165, 0, ${opacity})`,  // Orange
      `rgba(128, 0, 128, ${opacity})`,  // Purple
      `rgba(255, 192, 203, ${opacity})` // Pink
    ];
    return colors[index % colors.length];
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      <Appbar.Header 
      style={{minHeight:"max-content",margin:20}}>
        <Image 
          source={require('./Design-of-New-Logo-of-IITJ-2.png')}
          style={{ width: 90, height: 100, marginRight: 30 }}
        />
        <Appbar.Content title="Gas Sensor Visualization App" style={{alignSelf:"center"}} />
      </Appbar.Header>
  
      {liveData ?
        <Button title="Get Live Data" onPress={liveESPdata} /> :
        <Card style={{ padding: 1 }}>
          {paused ?
            <Button title="Resume Live Feed" onPress={resumeLiveFeed} /> :
            <Button title="Pause Live Feed" onPress={pauseLiveFeed} />
          }
          <Button title="Stop Live Feed" onPress={stopLiveFeed} />
          <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center" }}>
            Current Values:
          </Text>
          {Object.entries(currentValues).map(([key, value]) => (
            <Text key={key} style={{ fontSize: 16, textAlign: "center" }}>
              {key}: {value.toFixed(3)}
            </Text>
          ))}
        </Card>
      }
      <Button title="Plot CSV File" onPress={pickCSVFile} />
      <Button title="Upload CSV File to cloud" onPress= {pickFile} />
  
      {selectedValue && (
        <Text style={{ textAlign: "center", marginTop: 10, fontSize: 16 }}>
          📍 Value at {timestamps[selectedValue?.index + 1] || "point"}: {selectedValue?.value || "N/A"}
        </Text>
      )}
          <ScrollView contentContainerStyle={{ padding: 16, marginTop: 120, alignSelf: "center", flexGrow: 1 }} horizontal>
        {seriesHeaders.length > 0 && Object.keys(dataSeries).length > 0 && (
          <LineChart
            data={{
              labels: !liveData ? timestamps.slice(-(viewLastLive)) : [],
              datasets: seriesHeaders.map((header, index) => ({
                data: dataSeries[header] || [],
                color: (opacity = 1) => getColorForIndex(index, opacity),
                strokeWidth: 2,
                legend: header
              })),
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
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForVerticalLabels: {
                rotation: 270,
              }
            }}
            style={{ 
              marginVertical: 8,
              borderRadius: 20, 
              alignSelf: "center", 
              paddingTop: 20,
              borderWidth: 5, 
              borderColor: "#000" 
            }}
            bezier
            onDataPointClick={({ value, dataset, getColor, index }) => {
              setSelectedValue({ value, index });
            }}
          />
        )}
      </ScrollView>
      {Object.keys(dataSeries).length > 0 && seriesHeaders.length > 0 ? 
        <Text style={{ alignSelf: "center", marginTop: 5, fontSize: 14, fontWeight: "bold" }}>Time</Text> : 
        <></>
      }
    
    </ScrollView>
  );
}