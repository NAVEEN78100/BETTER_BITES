# 🍔 BETTER BITES – Smart Hostel Mess Management System

Better Bites is a modern, cross-platform mobile application designed to streamline the management of hostel mess operations. Built with React Native, Expo, and Firebase, it provides a premium, interactive experience for Students, Mess Managers, and Administrators.

## ✨ Key Features

### 🎓 Student Module
- **Premium Dashboard:** Dynamic greetings, intuitive Quick Actions grid, and smooth transitions using Moti.
- **Health Analytics:** Visual representation of dietary and health data using Victory Native charts.
- **Menu & Wallet:** Interactive "Today's Menu" card and "Wallet" balance tracking.
- **Feedback System:** Provide ratings and comprehensive feedback with interactive star rating animations.
- **Sick Leave Management:** Easy-to-use form with stagger animations for sick leave requests.
- **Detailed Profile:** Stores health information, dietary preferences, and account details.

### 🔐 Authentication & Roles
- **Role-Based Access:** Secure and distinct login portals for Students, Mess Managers, and Admins.
- **Firebase Integration:** Robust and secure user authentication and data storage using Firestore.
- **Custom Registration:** Detailed sign-up process capturing vital user preferences utilizing custom dropdown selectors.

### 🤖 AI-Powered Feedback Analysis
- **Smart Insights:** Built-in "Analyze Feedback with AI Model" feature to generate automated insights on the backend.
- **Actionable Data:** Translates raw feedback into positivity scores, loved/criticized food lists, and actionable suggestions.

### 👑 Admin & Manager Modules
- **Manager Dashboard:** Streamlined control over the daily menu and user feedback.
- **Admin Control:** Dedicated white and orange themed dashboard with premium UI elements for overall system oversight.

## 🛠️ Tech Stack & Architecture
- **Framework:** React Native with Expo Router (File-based routing)
- **UI/Animations:** React Native Paper, Moti, Expo Vector Icons
- **Backend/DB:** Firebase Authentication & Cloud Firestore
- **Charts:** Victory Native

## 🚀 Getting Started

Follow these steps to setup and run Better Bites locally.

### 1. Install Dependencies
Ensure you have Node.js installed, then install the necessary packages:

```bash
npm install
```

### 2. Start the Application

You can start the Expo development server in standard mode or use a tunnel if you need to run the app over an external network or bypass local network restrictions.

**Standard Start:**
```bash
npx expo start
```

**Run with Tunnel (Recommended if scanning QR code fails):**
```bash
npx expo start --tunnel
```

### 3. Usage & Testing
1. Download the **Expo Go** app from the App Store (iOS) or Play Store (Android).
2. Scan the generated QR code from the terminal or Expo dashboard in the browser to view the app directly on your physical device.

## 🎨 UI/UX Philosophy
The application prioritizes visual excellence with carefully curated color palettes (like the Admin Dashboard's black, white, and orange theme), modern typography, and extensive micro-animations to deliver a top-tier user experience.

## 🤝 Contributing

Contributions, bug reports, and feature requests are always welcome! Feel free to open an issue or submit a pull request if you are interested in improving the system.