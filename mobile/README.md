# Lab Commission Mobile

React Native CLI mobile app for the lab commission backend.

## Run

```bash
npm install
npm start
npm run android
```

The default API URL is `http://10.0.2.2:5000`, which works for Android emulator talking to a backend running on your computer.

For a real Android phone, update `src/services/api.js` to your computer IP address.

## Screens

- Admin dashboard
- Admin center, lab, test, agent, and staff creation
- Agent dashboard and collection submission
- Staff dashboard and bill creation with test search
