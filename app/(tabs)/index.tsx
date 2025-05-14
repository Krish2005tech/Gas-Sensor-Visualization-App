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

  let [dataSeries, setDataSeries] = useState<{ [key: string]: number[] }>({});

  let [timestamps, setTimestamps] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  let [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedValue, setSelectedValue] = useState(
    {
      value:"",
      index:"",
      title:""
    })
  let [currentValues, setCurrentValues] = useState<{ [key: string]: number }>({});
  let [seriesHeaders, setSeriesHeaders] = useState<string[]>([]);


  const [liveData, setLiveData] = useState(true);
  const [csvDataplot, setCsvDataplot] = useState(true);


  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);

  const viewLast = 2000;
  const interval_live = React.useRef<any>(null);
  const interval = React.useRef<any>(null);
  const viewLastLive = 300;
  
  const esp_url="http://192.168.1.5:3000/"
  const app_url = "https://script.google.com/macros/s/AKfycbx_KpRrrFZwu8fXoKHgPH7rX_xXJzw5tgevek8zQ0tvQkIilKyHtQkC3Kb8W-IGJtY/exec";


  const getCSVData = () => {
    // console.log(csvData);
    if (index < csvData.length) {
      const currentRow = csvData[index];
      let validData = true;
      // console.log("Current Row:", currentRow);
  
      // Check if current row has valid data
      for (const header of seriesHeaders) {
        const value = parseFloat(currentRow[header]);
        if (Number.isNaN(value) && isFinite(value)) {
          validData = false;
          break;
        }
      }
      // console.log("Valid Data:", validData);
      // console.log(seriesHeaders)
  
      if (!validData) {
        // Optionally stop interval if invalid data
        // clearInterval(interval.current);
        setCsvDataplot(true);
        return;
      }


        // Update timestamp
        const timeValue = currentRow.time || currentRow.timestamp;

        console.log("Time Value:", timeValue);
  
        if(!timeValue || timeValue === "NaN" || timeValue === "undefined") {
          // console.log("Invalid time value:", timeValue);
          setCsvDataplot(true);
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
      
      dataSeries = newDataSeries;
      setDataSeries(newDataSeries);
      setCurrentValues(newCurrentValues);
      // console.log("Current Values:", newCurrentValues);
      // console.log("Data Series:", newDataSeries);
  
    

      const formattedTime = typeof timeValue === 'number'
        ? parseFloat(timeValue).toFixed(3)
        : timeValue.toString();
  
      setTimestamps(prev => [...prev.slice(-(viewLast - 1)), formattedTime]);
      // setIndex(prev => prev + 1);
      index=index + 1;
      setIndex(index); 
      console.log("Index:", index);
    } else {
      // Optionally stop when data ends
      // clearInterval(interval.current);
      console.log("End of CSV data");
      setCsvDataplot(true);
      return;
    }
  };
  
  useEffect(() => {
    if (csvData.length > 0 && seriesHeaders.length > 0) {
      interval.current = setInterval(getCSVData, 200); // Adjust interval time as needed (1000ms = 1s)
    
      return () => {clearInterval(interval.current);
        // setCsvDataplot(true);
      }
    }
  }, [csvData, seriesHeaders]); // index doesn't need to be here as it's updated inside
  

  const pickCSVFile = async () => {
    setLiveData(true);
    setPaused(false);
    setCsvDataplot(false);
    clearInterval(interval_live.current);
    clearInterval(interval.current);
    setSelectedValue({
      value: "",
      index: "",
      title: ""
    });
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "text/csv" });

      if (!result.assets || result.assets.length === 0 || !result.assets[0].uri) {
        console.error("File selection was canceled or invalid URI.");
        return;
      }

      setDataSeries({});
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

  const processCSVData = (fileContent: string) => {
    readString(fileContent, {
      header: true,
      complete: (parsedData) => {
        if (parsedData.data.length > 0 ) {
          setCsvData(parsedData.data);
          setIndex(0);
          // setDataSeries({});
          setTimestamps([]);

          const headers = parsedData.meta.fields || Object.keys(parsedData.data[0]);

          console.log("Parsed headers:", headers);

          if ((headers.includes('time') || headers.includes('timestamp')) && headers.length > 1) {
            resetDataSeries(headers);
            setCsvData(parsedData.data);
            setIndex(0);

            console.log(dataSeries);

          } else {
            console.error("CSV must have a time/timestamp column and at least one data column");
          }


        }
      },
    });
  };


  const fetchData = async () => {


    const maxLength = viewLastLive || 30;//fallback

    try {
        const response = await fetch(esp_url, {
        method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*",  // Some APIs ignore this
          "Content-Type": "application/json",
        },
      });


      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      let responseText
      try{
      responseText = await response.text();}
      catch (error) {
        console.error("Error reading response text:", error);
        throw new Error(`Failed to read response: ${error.message}`);
      }
  
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response received');
      }

      // const json = await response.json();
      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Response text:", responseText);
        throw new Error(`Invalid JSON: ${parseError.message}`);
      }
      console.log("Parsed JSON:", json);
      const timestamp = new Date().toLocaleTimeString();
   
      if (Array.isArray(json.values)) {
        // Handle array format
        const newCurrentValues: Record<string, number> = {};
  
        json.values.forEach((value, index) => {
          const header = `Sensor${index + 1}`;
          newCurrentValues[header] = value;
        });

// Manually update currentValues
let updatedCurrentValues = { ...currentValues };
Object.keys(newCurrentValues).forEach((key) => {
  updatedCurrentValues[key] = newCurrentValues[key];
});
setCurrentValues(updatedCurrentValues);
currentValues = updatedCurrentValues;

// Manually update timestamps
let updatedTimestamps = [...timestamps.slice(-(maxLength - 1)), timestamp];
setTimestamps(updatedTimestamps);
timestamps = updatedTimestamps;

// Manually update dataSeries
let updatedDataSeries = { ...dataSeries };
json.values.forEach((value, index) => {
  const header = `Sensor${index + 1}`;
  updatedDataSeries[header] = [
    ...(updatedDataSeries[header] || []).slice(-(maxLength - 1)),
    value,
  ];
});
setDataSeries(updatedDataSeries);
dataSeries = updatedDataSeries;

console.log("Data Series:", dataSeries);
console.log("Timestamps:", timestamps);
console.log("Series Headers:", seriesHeaders);


if(json.temperature !== undefined){
  setTemperature(json.temperature);
}

if(json.humidity !== undefined){
  setHumidity(json.humidity);
}

  
      } else {
        // Handle object format
        const newCurrentValues: Record<string, number> = {};
        console.log("this was run")
        setDataSeries(prev => {
          const updated = { ...prev };
          for (const header of seriesHeaders) {
            if (json[header] !== undefined) {
              const value = parseFloat(json[header]);
              if (!Number.isNaN(value) && isFinite(value)) {
                updated[header] = [
                  ...(updated[header] || []).slice(-(maxLength - 1)),
                  value,
                ];
                newCurrentValues[header] = value;
              }
            }
          }
          return updated;
        });
  
        setCurrentValues(prev => ({ ...prev, ...newCurrentValues }));
        setTimestamps(prev => [...prev.slice(-(maxLength - 1)), timestamp]);
      }
  
    } catch (error) {
      console.error("Fetch error:", error.message || error);
      // Optional: Show toast or alert for user feedback
    }
  };

  // const getMessage = () => {
  //   if (value1 < 10) return "Low Value";
  //   if (value1 < 20) return "Normal Value";
  //   return "High Value";
  // };

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
            console.error('Error2:', error.message);
          });
      };
    } catch (error) {
      console.error('Error processing file:', error);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        // type: 'text/csv',
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
    // const json = {timestamps: 123456789, values: [1, 2, 3]}; // await response.json();
    console.log("Response:", response);
    const json = await response.json();
    let temp_headers: string[] = [];

    if (json.timestamp !== undefined && Array.isArray(json.values)) {
      temp_headers = json.values.map((_, index) => `Sensor${index + 1}`);
      temp_headers.push("timestamp");

      console.log("temp_headers", temp_headers);
      resetDataSeries(temp_headers);
      console.log("no errors till now")
    } else {
      console.error("Invalid format received:", json);
    }
  } catch (error) {
    console.error("Failed to fetch headers:", error);
  }
};

  const liveESPdata = () => {
    setSelectedValue({
      value: "",
      index: "",
      title: ""
    });
    setLiveData(false);
    setCsvDataplot(true);
    setPaused(false);
    clearInterval(interval_live.current);
    clearInterval(interval.current);

    setDataSeries({});
    setCurrentValues({});
    setTimestamps([]);
    setSeriesHeaders([]);
    currentValues={}

    timestamps=[]
    dataSeries={}
    seriesHeaders=[]



    fetchAndResetHeaders();
    interval_live.current = setInterval(fetchData, 1000);
  }

  const stopLiveFeed = () => {
    setLiveData(true);
    clearInterval(interval_live.current);
    dumpToCSV();
    setSelectedValue({
      value: "",
      index: "",
      title: ""
    });
  }

  const stopCSVFeed = () => {
    setLiveData(true);
    clearInterval(interval.current);
    setCsvDataplot(true);
    setSelectedValue({
      value: "",
      index: "",
      title: ""
    });
  }
  const resumeCSVFeed = () => {
    clearInterval(interval.current); // Optional: ensure no duplicate interval
    setPaused(false);
    interval.current = setInterval(getCSVData, 1000); // or your desired delay
  };
  

  const pauseLiveFeed = () => {
    // setLiveData(true);
    clearInterval(interval_live.current);
    clearInterval(interval.current);
    setPaused(true);
  }

  const liveLabels = Array(dataSeries[seriesHeaders[0]]?.length || 2).fill("");

  const resumeLiveFeed = () => {
    // setLiveData(false);
    clearInterval(interval_live.current);
    interval_live.current = setInterval(fetchData, 1000);
    setPaused(false);
    setCsvDataplot(true);
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
      <Appbar.Header style={{ minHeight: "max-content", margin: 20 }}>
  <Image 
    source={require('./Design-of-New-Logo-of-IITJ-2.png')}
    style={{ width: 90, height: 100, marginRight: 10 }}
  />
  
  <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
    <Appbar.Content 
      title="Gas Sensor" 
      titleStyle={{ textAlign: 'center', fontSize: 24 }} 
    />
    <Appbar.Content 
      title="Visualization App" 
      titleStyle={{ textAlign: 'center', fontSize: 20 }} 
    />
  </View>
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
          {/* added sensor values */}
          {Object.entries(currentValues).map(([key, value]) => (
            <Text key={key} style={{ fontSize: 16, textAlign: "center" }}>
              {key}: {value.toFixed(3)}
            </Text>
          ))}
          {temperature!==0 && (
            <Text style={{ fontSize: 16, textAlign: "center" }}>
              Temperature: {temperature.toFixed( 1)} °C
            </Text>
          )}

          {humidity!==0 && (
            <Text style={{ fontSize: 16, textAlign: "center" }}>
              Humidity: {humidity.toFixed(1)} %
            </Text>
          )}

          {/*left :  add temp / humidity if available */}
        </Card>
      }
      {csvDataplot ?
          <Button title="Plot CSV File" onPress={pickCSVFile} />:
        <Card style={{ padding: 1 }}>
          {paused ?
            <Button title="Resume CSV Feed" onPress={resumeCSVFeed} /> :
            <Button title="Pause CSV Feed" onPress={pauseLiveFeed} />
          }
          <Button title="Stop CSV Feed" onPress={stopCSVFeed} />
        </Card>
      }
      <Button title="Upload CSV File to cloud" onPress={pickFile} />


      {selectedValue.title!="" && (
        <Text style={{ textAlign: "center", marginTop: 10, fontSize: 16 }}>
          📍 Value of {selectedValue?.title || ""} at {timestamps[selectedValue?.index + 1] || "point"}: {selectedValue?.value || "N/A"} V
        </Text>
      )}

  
      <ScrollView contentContainerStyle={{ padding: 16, marginTop: 120, alignSelf: "center", flexGrow: 1 }} horizontal >
        {seriesHeaders.length > 1 && Object.keys(dataSeries).length > 1 && ((dataSeries.Sensor1 && dataSeries.Sensor1.length > 1)||(dataSeries.reading1 && dataSeries.reading1.length > 1))  && (
          <LineChart
            data={{
              labels: !liveData
  ? timestamps.slice(-viewLastLive)
  : liveLabels,
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
              color: (opacity = 0) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForVerticalLabels: {
                rotation: 270,
              },

              propsForDots: {
                r: '5',
              },
            }}
            style={{ marginVertical: 8,borderRadius: 20, alignSelf: "center", paddingTop: 20,borderWidth: 0, borderColor: "#000" }}
            bezier
            withDots={true}
            withInnerLines={false}
            withTouchableDots={true}
            onDataPointClick={({ value, dataset, getColor, index }) => {
              setSelectedValue({ value, index, title: dataset.legend });
              console.log("Clicked data point:", { value, dataset, getColor, index });
            }}
          />
        )}
      </ScrollView>
      {/* set text based on dataseties length */}
      {Object.keys(dataSeries).length > 2 && seriesHeaders.length > 1 ? 
        <Text style={{ alignSelf: "center", marginTop: 5, fontSize: 14, fontWeight: "bold" }}>Time</Text> : 
        <></>
      }
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