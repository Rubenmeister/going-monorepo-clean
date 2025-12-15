import { Platform } from 'react-native';

// Android Emulator uses 10.0.2.2 to access localhost of the host machine.
// iOS Simulator uses localhost.
// Real devices would need the machine's LAN IP.

const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_URL = `http://${LOCALHOST}:3000/api`;
