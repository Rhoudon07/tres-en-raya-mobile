import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent llama a AppRegistry.registerComponent('main', () => App);
// Asegura que tanto con Expo Go como en builds nativos (EAS Build / APK) el entorno se configure correctamente.
registerRootComponent(App);
