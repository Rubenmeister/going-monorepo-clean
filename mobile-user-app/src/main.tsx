import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from '../App';

// El root REAL de la app vive en App.tsx: ThemeProvider (22 pantallas llaman
// useTheme(), que LANZA sin el provider → pantalla en blanco tras el splash),
// StatusBar temático y la carga del snapshot del motor de tarifas al arrancar.
// Este archivo era un entry duplicado que definía su propio App SIN nada de eso
// y, al ser el `main` de package.json, era el que efectivamente se montaba.
// Ahora solo registra el App.tsx correcto — una sola fuente de verdad.
registerRootComponent(App);
