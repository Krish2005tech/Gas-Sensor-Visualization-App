package main

import (
	"encoding/csv"
	"flag"
	"fmt"
	"log"
	"math"
	"os"
	"strconv"
)

type Point struct {
	Time  string
	Value float64
}

func main() {
	filePath := flag.String("file", "", "Path to CSV file")
	window := flag.Int("window", 2, "Window size for peak/valley detection")
	prominence := flag.Float64("prominence", 1.0, "Minimum prominence to consider a peak or valley")
	flag.Parse()

	if *filePath == "" {
		log.Fatal("Please provide the path to the CSV file using -file flag")
	}

	f, err := os.Open(*filePath)
	if err != nil {
		log.Fatalf("Failed to open file: %v", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatalf("Failed to read CSV: %v", err)
	}

	if len(records) < 2 {
		log.Fatal("CSV must contain header and at least one data row")
	}

	headers := records[0]
	sensors := headers[1:]

	data := make(map[string][]Point)
	for _, sensor := range sensors {
		data[sensor] = []Point{}
	}

	for _, row := range records[1:] {
		time := row[0]
		for i, sensor := range sensors {
			val, err := strconv.ParseFloat(row[i+1], 64)
			if err != nil {
				log.Fatalf("Invalid value at time %s for sensor %s", time, sensor)
			}
			data[sensor] = append(data[sensor], Point{Time: time, Value: val})
			
		}
	}
	fmt.Println("✅ CSV loaded successfully. Beginning analysis...")

	for sensor, points := range data {
		fmt.Printf("\nSensor: %s\n", sensor)
		findPeaksAndValleys(points, *window, *prominence)
	}
}

func findPeaksAndValleys(points []Point, window int, minProminence float64) {
	n := len(points)
	for i := window; i < n-window; i++ {
		isPeak := true
		isValley := true

		for j := 1; j <= window; j++ {
			if points[i].Value <= points[i-j].Value || points[i].Value <= points[i+j].Value {
				isPeak = false
			}
			if points[i].Value >= points[i-j].Value || points[i].Value >= points[i+j].Value {
				isValley = false
			}
		}

		if isPeak {
			base := math.Min(points[i-window].Value, points[i+window].Value)
			if points[i].Value-base >= minProminence {
				fmt.Printf("Peak at time %s with value %.2f (base: %.2f)\n", points[i].Time, points[i].Value, base)
			}
		}

		if isValley {
			base := math.Max(points[i-window].Value, points[i+window].Value)
			if base-points[i].Value >= minProminence {
				fmt.Printf("Valley at time %s with value %.2f (base: %.2f)\n", points[i].Time, points[i].Value, base)
			}
		}
	}
}
