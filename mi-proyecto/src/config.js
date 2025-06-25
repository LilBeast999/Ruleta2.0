// Configuración de la aplicación
const config = {
  // URL base del backend
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? '/api'  // En producción usamos el proxy de nginx
    : 'http://localhost:7002',  // En desarrollo conectamos directamente al backend
  
  // Otras configuraciones pueden ir aquí
};

export default config;
