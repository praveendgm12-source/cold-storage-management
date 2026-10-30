# Coolza – Cold storage booking for farmers

React + TypeScript + Vite + Tailwind, Firebase Auth + Firestore (project `coolza-ce9af`).
Languages: English, తెలుగు (Telugu), தமிழ் (Tamil) – switch from the language menu on the login screen or dashboard header. The choice is remembered.

## Features
- Farmer / Storage Owner sign up and login
- Farmers: search, filter by district, sort by price/space, book storage, cancel pending requests, download PDF receipts, spending analytics
- Owners: add/edit/delete storage units with photos, approve/reject/complete bookings, income and capacity analytics
- Live updates and in-app notifications (shown in the reader's language)
- Space is reserved on booking and returned on reject, cancel or completion (Firestore transactions)

## Run
    npm install
    npm run dev          # local dev
    npm run build        # web build in dist/ (deploy to Netlify / Firebase Hosting)

## Android APK
    npx vite build -c vite.single.config.ts   # single-file build in dist-single/
    cd ../android && ./build.sh               # see variables at the top of build.sh
The `android/` folder is a lightweight WebView app (no Gradle). Keep `coolza-release.jks` (password coolza123) to sign future updates.
