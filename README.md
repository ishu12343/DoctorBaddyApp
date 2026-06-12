# DoctorBuddy Mobile App

React Native (Expo) mobile application for the DoctorBuddy healthcare platform. This app connects to the same backend API used by the web frontend at `D:\DoctorBaddy\DoctorBaddy`.

## API Backend

```
https://doctorbaddy-backend.onrender.com/
```

## Features

### Public
- Home screen with branding and quick login
- Services overview
- Contact & support

### Patient
- Login / Registration
- Dashboard with appointment stats
- Find & book doctors (search by specialty, city, name)
- Manage appointments (cancel, reschedule, rate)
- Profile view & edit with document upload

### Doctor
- Login / Registration
- Dashboard with stats, ratings, recent activities
- Appointment management (approve, reject, complete, reschedule)
- Patient list with search
- Profile view & edit

### Admin
- Login / Registration
- Dashboard overview (doctors, patients, pending approvals)
- Doctor management (view, approve, reject, suspend, unsuspend)
- Patient management (view, activate, deactivate)

## Getting Started

```bash
cd D:\DoctorBaddy\DoctorBaddyApp
npm install
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator (macOS only)
- Scan QR code with Expo Go app on your phone

## Build for Production

```bash
# Android APK
npx expo prebuild
npx expo run:android

# iOS (macOS only)
npx expo run:ios
```

## Project Structure

```
src/
├── config/api.ts          # API base URL
├── constants/theme.ts     # Colors and spacing
├── context/AuthContext.tsx # Auth state management
├── services/              # API service layer
│   ├── apiClient.ts
│   ├── patientApi.ts
│   ├── doctorApi.ts
│   └── adminApi.ts
├── navigation/            # React Navigation setup
├── components/            # Reusable UI components
└── screens/               # All app screens
    ├── public/
    ├── auth/
    ├── patient/
    ├── doctor/
    └── admin/
```

## Note

The web frontend at `D:\DoctorBaddy\DoctorBaddy` is unchanged. This is a separate mobile project.
