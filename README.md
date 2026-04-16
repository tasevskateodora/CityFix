# CityFix 🏙️

A React Native mobile app for reporting city infrastructure problems. Citizens can submit reports with photos, GPS location, and descriptions. AI automatically classifies each report. Reports are visible on a map and in a social feed.

---

## Prerequisites

Make sure you have the following installed before starting:

- [Node.js](https://nodejs.org) (LTS version)
- [Expo Go](https://expo.dev/client) app on your phone (App Store / Google Play)
- The **CityFix backend** running (see backend repo)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/CityFix.git
cd CityFix
```

### 2. Install dependencies

```bash
npm install
npx expo install
```

### 3. Configure the backend URL

Open `api/client.js` and replace the IP address with your computer's local IP:

```javascript
export const BASE_URL = 'http://YOUR_IP:8081';
```

**How to find your IP:**

macOS:
```bash
ipconfig getifaddr en0
```

Windows:
```bash
ipconfig
# look for IPv4 Address under your WiFi adapter
```

> ⚠️ Your phone and computer must be on the **same WiFi network**.

---

## Running the App

### Step 1 — Start the backend first

Open the backend project (`city-problem-reporting-system`) in IntelliJ and click the ▶️ Run button. Wait until you see:

```
Started CityProblemReportingApplication
```

### Step 2 — Start the frontend

```bash
npx expo start
```

Or with cache cleared (recommended after installing new packages):

```bash
npx expo start --clear
```

### Step 3 — Open on your phone

- Scan the QR code with the **Expo Go** app (Android)
- Or scan with the **Camera app** (iOS)

### Running on a simulator

iOS Simulator:
```bash
npx expo start --ios
```

Android Emulator (use `10.0.2.2` instead of your IP in `client.js`):
```bash
npx expo start --android
```

---

## Project Structure

```
CityFix/
├── api/
│   ├── client.js          # Axios instance with Basic Auth
│   └── api.js             # All API methods
├── components/
│   └── PostCard.js        # Reusable post card component
├── constants/
│   └── theme.js           # Colors, category icons, status labels
├── context/
│   └── AuthContext.js     # Auth state and login/logout
├── navigation/
│   └── AppNavigator.js    # All screen navigation
├── screens/
│   ├── SplashScreen.js
│   ├── OnboardingScreen.js
│   ├── LoginScreen.js
│   ├── HomeScreen.js      # Social feed
│   ├── MapScreen.js       # Map with report pins
│   ├── ReportScreen.js    # Submit a new report
│   ├── MyReportScreen.js  # Current user's reports
│   ├── ProfileScreen.js   # User profile
│   ├── PostDetailScreen.js# Post details + comments
│   └── EditProfileScreen.js
└── App.js
```

---

## Features

- 📸 Submit reports with photos from camera or gallery
- 🤖 AI automatically classifies the report category from the photo
- 📍 GPS auto-detects your location when submitting
- 🗺️ Map view showing all reports as category pins
- 📰 Social feed with likes and comments
- 👤 User profiles with report history
- 🔐 Secure login with credentials stored on device

---

## Authentication

The app uses **HTTP Basic Auth**. After logging in, your credentials are securely stored on the device using `expo-secure-store` and automatically attached to every API request.

---

## Troubleshooting

**Can't connect to backend:**
- Make sure the backend is running in IntelliJ
- Make sure your phone and computer are on the same WiFi
- Double-check the IP address in `api/client.js`
- Try opening `http://YOUR_IP:8081/api/posts` in your phone's browser — if you see JSON, the connection works

**Location not working:**
- Make sure you granted location permissions when prompted
- On iOS Simulator, go to Features → Location → Custom Location and set a location

**Expo QR code not scanning:**
- Make sure you're using Expo Go app, not just the camera
- Try pressing `w` in the terminal to open in browser instead

**Metro bundler errors after installing packages:**
```bash
npx expo start --clear
```

---

## Backend

The backend repository is at:
```
https://github.com/YOUR_USERNAME/city-problem-reporting-system
```

It runs on `http://localhost:8081` and requires:
- Java 17+
- PostgreSQL database
- OpenRouter API key (for AI classification)