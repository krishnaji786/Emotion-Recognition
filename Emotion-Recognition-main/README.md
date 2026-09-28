# Face Gesture and Emotion Recognition Web App

## Overview
This serverless web application uses TensorFlow.js and Haar Cascade to track facial gestures and recognize dominant emotions in real-time, directly in the browser without requiring a backend server.

## Features
- Real-time face tracking using Haar Cascade
- Dominant emotion recognition
- Serverless architecture - runs entirely in the browser
- Easy deployment on platforms like Vercel

## Technologies Used
- HTML5
- CSS3
- JavaScript
- TensorFlow.js
- Haar Cascade (haarcascade.xml)
- http-server (for local development)
- FastAPI

## Project Structure
- `index.html`: Main HTML file (includes embedded CSS and JavaScript)
- `haarcascade.xml`: Haar Cascade file for face detection
- `models/`: Directory containing TensorFlow.js model files

## Setup and Local Development
1. Clone the repository:
   git clone https://github.com/manish-9245/emotion-recognition.git
2. Navigate to the project directory:
   cd face-emotion-recognition
3. Install http-server globally:
   npm install http-server -g
4. Start the local server:
   npm run
   5. Open your browser and navigate to `http://localhost:8080` (or the port shown in your terminal).

## Deployment on Vercel
1. Sign up for a Vercel account at https://vercel.com if you haven't already.
2. Install the Vercel CLI: `npm i -g vercel`
3. From your project directory, run: `vercel`
4. Follow the prompts to link your project to Vercel.
5. Your app will be deployed and you'll receive a URL for the live version.

## Usage
1. Open the application in a web browser.
2. Allow camera access when prompted.
3. Position your face in view of the camera.
4. The app will track your facial gestures and display the dominant emotion detected.

## How It Works
1. Haar Cascade classifier detects faces in the video stream.
2. Detected face regions are passed to a TensorFlow.js model.
3. The model analyzes facial features and predicts the dominant emotion.
4. Results are displayed in real-time on the webpage.

## Performance Considerations
- Performance may vary based on the user's device capabilities.
- Use a device with a good camera and a modern web browser for optimal results.

## Privacy
- All processing is done locally in the user's browser.
- No video or image data is sent to any server.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements
- TensorFlow.js team
- OpenCV for Haar Cascade classifier
- Vercel for serverless deployment platform

## Troubleshooting
- Ensure camera permissions are granted in your browser.
- Check internet connection for model loading issues.
- Use http-server for local development to avoid CORS issues.

## Future Improvements
- Support for multiple face tracking
- More detailed emotion analysis
- Mobile device optimization

For questions or issues, please open an issue on the GitHub repository.
