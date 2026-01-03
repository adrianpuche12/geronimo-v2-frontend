# Geronimo 2.0 Frontend - Nilo

Frontend de Geronimo 2.0, asistente inteligente de documentación con IA.

## 🎨 Características

- **Tema Oscuro Geronimo 2.0**: Interfaz moderna con colores #000000 (negro) y #FF6600 (naranja)
- **DocumentReader Profesional**: Vista de lectura estilo Medium/Notion con:
  - Header ultra-compacto horizontal
  - Tabla de contenidos automática
  - Barra de progreso de lectura
  - Búsqueda dentro del documento
  - Descarga y copia de texto
  - Tiempo estimado de lectura
- **Gestión de Documentos**: Upload, visualización y búsqueda de PDFs, Word, imágenes y texto
- **Chat con IA**: Interacción con documentos usando OpenAI
- **Motor de Prompts CAPA 4**: Modos especializados (general, estadísticas, negocios)
- **Integraciones**: Gmail, GitHub, Google Drive

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 16+ y npm
- Backend de Geronimo 2.0 corriendo

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/adrianpuche12/geronimo-v2-frontend.git
cd geronimo-v2-frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# API Backend
REACT_APP_API_URL=/api

# Autenticación (opcional)
REACT_APP_DISABLE_AUTH=true  # Desactivar Keycloak para desarrollo

# Keycloak (si DISABLE_AUTH=false)
REACT_APP_KEYCLOAK_URL=http://localhost:8095/
REACT_APP_KEYCLOAK_REALM=geronimo-v2
REACT_APP_KEYCLOAK_CLIENT_ID=geronimo-v2-frontend
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm start

# Abrir http://localhost:3000
```

### Producción

```bash
# Generar build optimizado
REACT_APP_API_URL=/api REACT_APP_DISABLE_AUTH=true npm run build

# Los archivos estarán en ./build/
```

## 📁 Estructura del Proyecto

```
src/
├── componentes/
│   ├── document-reader.js      # Vista de lectura profesional
│   ├── integrations.js         # Gestión de integraciones
│   ├── modal.js                # Modales de vista previa
│   ├── project-bar.js          # Barra lateral de proyectos
│   ├── prompt-engine.js        # Motor CAPA 4
│   ├── unified-header.js       # Header unificado
│   ├── UserHeader.js           # Header del usuario
│   └── chat.js                 # Componente de chat
├── styles/
│   ├── document-reader.css     # Estilos del reader (tema oscuro)
│   ├── integrations.css
│   ├── modal.css
│   ├── project-bar.css
│   ├── prompt-engine.css
│   └── unified-header.css
├── context/
│   └── AuthContext.js          # Contexto de autenticación
├── assets/
│   └── images/
│       └── logo.png            # Logo de Nilo
├── App.js                      # Componente principal
└── index.js                    # Punto de entrada
```

## 🎨 Componentes Principales

### DocumentReader

Vista de lectura profesional para documentos con tema oscuro Geronimo 2.0.

**Características:**
- Header compacto horizontal con metadata inline
- Tabla de contenidos automática desde headings
- Barra de progreso de lectura en tiempo real
- Búsqueda dentro del documento
- Botones de descarga, copia e impresión
- Soporte para PDF, Word, Markdown, texto plano

**Uso:**
```jsx
import { DocumentReader } from './componentes/document-reader';

<DocumentReader
  document={documentObject}
  onClose={() => setShowReader(false)}
/>
```

### PromptEngine (CAPA 4)

Motor de prompts especializados con 3 modos:

- **General**: Respuestas generales sobre documentos
- **Estadísticas**: Análisis numérico y métricas
- **Negocios**: Insights de negocio

## 🔧 Configuración

### Desactivar Autenticación

Para desarrollo sin Keycloak:

1. Agregar en `.env`:
```bash
REACT_APP_DISABLE_AUTH=true
```

2. La aplicación permitirá acceso sin login

### Con Keycloak

1. Configurar variables en `.env`:
```bash
REACT_APP_KEYCLOAK_URL=http://your-keycloak:8095/
REACT_APP_KEYCLOAK_REALM=geronimo-v2
REACT_APP_KEYCLOAK_CLIENT_ID=geronimo-v2-frontend
```

2. NO incluir `REACT_APP_DISABLE_AUTH` o setearla a `false`

## 🎨 Paleta de Colores (Geronimo 2.0)

```css
/* Principales */
--primary-black: #000000;
--primary-dark: #111111;
--accent-orange: #FF6600;

/* Secundarios */
--dark-bg: #0a0a0a;
--border-dark: #2a2a2a;
--text-light: #ffffff;
--text-gray: #cccccc;
```

## 📦 Build y Deploy

### Build Local

```bash
npm run build
```

### Deploy a Servidor

```bash
# En el servidor
cd /opt/geronimo/frontend-src
git pull origin master
REACT_APP_API_URL=/api REACT_APP_DISABLE_AUTH=true npm run build
cp -r build/* /opt/geronimo-v2/frontend/
nginx -s reload
```

## 🐛 Troubleshooting

### No veo los proyectos en producción

1. Verificar que el backend está corriendo:
```bash
curl http://localhost:3005/api/projects
```

2. Verificar que nginx está proxeando correctamente:
```bash
curl http://localhost:82/api/projects
```

3. Verificar que `REACT_APP_DISABLE_AUTH=true` está en el build:
```bash
# Rebuild con variables explícitas
REACT_APP_API_URL=/api REACT_APP_DISABLE_AUTH=true npm run build
```

4. Limpiar caché del navegador: Ctrl + Shift + R

### Favicon no actualiza

1. Limpiar caché del navegador completamente
2. Cerrar todas las pestañas de la app
3. Volver a abrir

## 📝 Changelog

### v2.0.0 (2026-01-03)

#### Agregado
- **DocumentReader**: Vista profesional estilo Medium con tema oscuro
- **Header compacto**: Layout horizontal para maximizar espacio de contenido
- **Soporte para desactivar autenticación**: Variable `REACT_APP_DISABLE_AUTH`
- **Logo de Nilo**: Favicon actualizado en todas las resoluciones
- **Extracción de texto**: PDF y Word extraídos automáticamente para búsqueda
- **Integrations**: Gestión de Gmail, GitHub, Google Drive
- **Prompt Engine CAPA 4**: 3 modos especializados de análisis

#### Modificado
- Tema completo migrado a Geronimo 2.0 (negro + naranja)
- Manifest.json actualizado con branding de Nilo
- AuthContext con soporte para bypass de autenticación

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Proyecto privado - Geronimo 2.0

## 👥 Autores

- **Jorge Adrian Pucheta** - Desarrollo Frontend
- **Claude Sonnet 4.5** - Asistente de desarrollo IA

## 🔗 Links

- [Backend Repository](https://github.com/adrianpuche12/geronimo-v2-backend)
- [Documentación de Deployment](./DEPLOYMENT_2025-12-27.md)
