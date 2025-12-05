import { AppRegistry } from 'react-native';
import App from './app/App';

// REGISTRO MÚLTIPLE: "La técnica de la escopeta"
// Registramos la app con todos los nombres probables para que Android la encuentre sí o sí.

AppRegistry.registerComponent('MobileUserApp', () => App);
AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent('mobile-user-app', () => App);
AppRegistry.registerComponent('GoingUser', () => App); 
