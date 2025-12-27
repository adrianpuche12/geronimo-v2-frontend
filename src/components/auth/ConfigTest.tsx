import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface BackendConfig {
  keycloakUrl: string;
  realm: string;
  clientId: string;
  publicKeyUrl: string;
}

interface BackendResponse {
  name: string;
  version: string;
  message: string;
  endpoints: Record<string, string>;
}

const ConfigTest: React.FC = () => {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [backendConfig, setBackendConfig] = useState<BackendConfig | null>(null);
  const [backendRoot, setBackendRoot] = useState<BackendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Leer variables de entorno del frontend
    const frontendEnv = {
      'API_URL': process.env.REACT_APP_API_URL || 'not set',
      'KEYCLOAK_URL': process.env.REACT_APP_KEYCLOAK_URL || 'not set',
      'KEYCLOAK_REALM': process.env.REACT_APP_KEYCLOAK_REALM || 'not set',
      'KEYCLOAK_CLIENT_ID': process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'not set',
      'USE_V2': process.env.REACT_APP_USE_V2 || 'not set',
      'BRAND_NAME': process.env.REACT_APP_BRAND_NAME || 'not set',
      'APP_NAME': process.env.REACT_APP_APP_NAME || 'not set',
      'APP_VERSION': process.env.REACT_APP_APP_VERSION || 'not set',
    };
    setEnvVars(frontendEnv);

    // Verificar conexión con backend
    const checkBackend = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;

        // Verificar ruta raíz
        const rootResponse = await axios.get(`${apiUrl}/`);
        setBackendRoot(rootResponse.data);

        // Verificar configuración de auth
        const configResponse = await axios.get(`${apiUrl}/api/v2/auth/config`);
        setBackendConfig(configResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Error conectando con backend:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    checkBackend();
  }, []);

  const getStatusColor = (value: string) => {
    if (value === 'not set') return '#ff4444';
    return '#44ff44';
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#eb6e24' }}>🔧 Geronimo V2 - Verificación de Configuración</h1>

      {/* Variables de Entorno Frontend */}
      <div style={{
        border: '2px solid #2c507f',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '8px'
      }}>
        <h2 style={{ color: '#2c507f' }}>📝 Variables de Entorno (Frontend)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Variable</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(envVars).map(([key, value]) => (
              <tr key={key} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#aaa' }}>REACT_APP_{key}</td>
                <td style={{
                  padding: '8px',
                  color: getStatusColor(value),
                  fontWeight: 'bold'
                }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Conexión con Backend */}
      <div style={{
        border: '2px solid #eb6e24',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '8px'
      }}>
        <h2 style={{ color: '#eb6e24' }}>🔗 Conexión con Backend V2</h2>

        {loading && <p style={{ color: '#ffaa00' }}>⏳ Conectando con backend...</p>}

        {error && (
          <div style={{
            backgroundColor: '#ff4444',
            color: '#fff',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            ❌ Error: {error}
          </div>
        )}

        {backendRoot && (
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ color: '#44ff44' }}>✅ Backend Respondiendo</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px', color: '#aaa' }}>Nombre:</td>
                  <td style={{ padding: '8px' }}>{backendRoot.name}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px', color: '#aaa' }}>Versión:</td>
                  <td style={{ padding: '8px' }}>{backendRoot.version}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px', color: '#aaa' }}>Mensaje:</td>
                  <td style={{ padding: '8px' }}>{backendRoot.message}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {backendConfig && (
          <div>
            <h3 style={{ color: '#44ff44' }}>✅ Configuración de Keycloak (desde Backend)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px', color: '#aaa' }}>Keycloak URL:</td>
                  <td style={{ padding: '8px' }}>{backendConfig.keycloakUrl}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px', color: '#aaa' }}>Realm:</td>
                  <td style={{ padding: '8px' }}>{backendConfig.realm}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px', color: '#aaa' }}>Client ID:</td>
                  <td style={{ padding: '8px' }}>{backendConfig.clientId}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px', color: '#aaa' }}>Public Key URL:</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{backendConfig.publicKeyUrl}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verificación de Coherencia */}
      {backendConfig && (
        <div style={{
          border: '2px solid #44ff44',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <h2 style={{ color: '#44ff44' }}>✅ Verificación de Coherencia</h2>
          <ul>
            <li style={{
              color: envVars.KEYCLOAK_URL === backendConfig.keycloakUrl ? '#44ff44' : '#ff4444',
              marginBottom: '8px'
            }}>
              {envVars.KEYCLOAK_URL === backendConfig.keycloakUrl ? '✅' : '❌'}
              {' '}Keycloak URL coincide: {envVars.KEYCLOAK_URL === backendConfig.keycloakUrl ? 'SÍ' : 'NO'}
            </li>
            <li style={{
              color: envVars.KEYCLOAK_REALM === backendConfig.realm ? '#44ff44' : '#ff4444',
              marginBottom: '8px'
            }}>
              {envVars.KEYCLOAK_REALM === backendConfig.realm ? '✅' : '❌'}
              {' '}Realm coincide: {envVars.KEYCLOAK_REALM === backendConfig.realm ? 'SÍ' : 'NO'}
            </li>
            <li style={{
              color: envVars.API_URL === process.env.REACT_APP_API_URL ? '#44ff44' : '#ff4444',
              marginBottom: '8px'
            }}>
              {envVars.API_URL === process.env.REACT_APP_API_URL ? '✅' : '❌'}
              {' '}API URL configurada correctamente
            </li>
          </ul>
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#2c507f',
        borderRadius: '8px'
      }}>
        <h3>📋 Próximos Pasos</h3>
        <ol>
          <li>✅ Verificar variables de entorno frontend</li>
          <li>✅ Verificar conexión con backend V2</li>
          <li>⏳ Implementar flujo de autenticación Keycloak</li>
          <li>⏳ Crear componentes V2 con Material-UI</li>
        </ol>
      </div>
    </div>
  );
};

export default ConfigTest;
