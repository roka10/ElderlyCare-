🧠 AI-Powered Elderly Care Surveillance System

This project introduces an intelligent home monitoring system designed to enhance safety and well-being for elderly individuals. It leverages deep learning and computer vision to detect human presence, posture, emotions, and unusual movements in real time.

🚀 Features

Real-Time Human Detection: Powered by YOLOv8 for fast and accurate person tracking.

Posture & Fall Detection: Uses MediaPipe for skeletal and posture analysis to identify falls or abnormal movements.

Emotion Recognition: Analyzes facial expressions to assess the user’s emotional state.

Instant Alerts: Sends notifications to caregivers during emergencies.

Task Reminders: Provides personalized reminders to help seniors with daily activities.

🧩 Tech Stack

Python

YOLOv8 (Ultralytics)

MediaPipe

OpenCV

TensorFlow / Keras (for emotion recognition)

Firebase / SMTP / Twilio (optional) for alert and reminder integration

⚙️ Workflow

Capture Video Feed using a webcam or CCTV input.

Detect Human Presence via YOLOv8.

Analyze Posture & Movements through MediaPipe skeleton tracking.

Recognize Emotions from facial expressions using a CNN model.

Trigger Alerts when abnormal movement, fall, or distress is detected.

Provide Reminders based on scheduled daily tasks.

📸 Example Use Cases

Detecting a fall or unusual inactivity and alerting caregivers instantly.

Monitoring emotional well-being through facial expression recognition.

Reminding seniors about medicine, meals, or appointments.

🏗️ Setup & Installation
# Clone this repository
git clone https://github.com/yourusername/elderly-care-ai.git

# Navigate into the project folder
cd elderly-care-ai

# Install dependencies
pip install -r requirements.txt

# Run the main script
python main.py

📬 Alerts & Notifications (Optional)

You can integrate the system with Firebase, Twilio, or SMTP to send:

Emergency alerts to caregivers

Task reminders to users

🧠 Future Improvements

Voice command support

Integration with smart home devices

Cloud-based monitoring dashboard

🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to modify.
