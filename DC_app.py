from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
import serial
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains
ser = serial.Serial('/dev/ttyACM0', 9600)





# Route to serve images
@app.route('/json')
def serve_image():
    line = ser.readline().decode('utf-8').strip()

    separated_list = line.split(',')
    
    temperature = float(separated_list[0][12:])
    humidity = float(separated_list[1][9:])
    sensor_value1 = float(separated_list[2][3:])
    sensor_value2 = float(separated_list[3][3:])
    sensor_value3 = float(separated_list[4][3:])
    sensor_value4 = float(separated_list[5][3:])


    return jsonify({
        'Timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'temperature': temperature,
        'humidity': humidity,
        'values':[sensor_value1, sensor_value2, sensor_value3, sensor_value4],
        'value1': sensor_value1,
        'value2': sensor_value2,
        'value3': sensor_value3,
        'value4': sensor_value4
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)