# Arquitectura del proyecto
``` 
EcoSoftwareAngular/
├── 🗂️.angular/                # Configuraciones internas de Angular CLI
├── 🗂️.vscode/                 # Configuraciones específicas de VSCode
├── 🗂️node_modules/            # Librerías instaladas vía npm
├── 🗂️public/                  
│   └── ⭐ favicon.ico           # Ícono del proyecto
├── 🗂️src/
│   ├── 🗂️app/                 
│   │   ├── 🗂️inicio/           # Componentes de la página de inicio
│   │   ├── 🗂️usuario/          # Componentes relacionados con usuarios
│   │   ├───── 🗂️usuario_component/          # Componentes relacionados con usuarios
│   │   ├── 🔵 app.config.ts     # Configuraciones globales de la app (API URL, constantes)
│   │   ├── 🔵 app.css           # Estilos globales de la aplicación
│   │   ├── 🔵 app.html          # Plantilla principal (root) de la app
│   │   ├── 🔵 app.routes.ts     # Configuración de rutas Standalone
│   │   ├── 🔵 app.spec.ts       # Pruebas unitarias para App
│   │   └── 🔵 usuario-service.ts # Servicio para consumir APIs de usuario
│   ├── 🔵 index.html             # Archivo HTML principal cargado por Angular
│   ├── 🔵 main.ts                # Punto de entrada de la aplicación
│   └── 🔵 styles.css             # Estilos globales de la app
├── 🔵 .editorconfig              # Configuración de editor
├── 🔵 .gitignore                 # Archivos a ignorar en Git
├── 🔵 angular.json               # Configuración del proyecto Angular
├── 🔵 package.json               # Dependencias, scripts y metadata del proyecto
├── 🔵 package-lock.json          # Bloquea las versiones de dependencias
├── 🔵 tsconfig.app.json          # Configuración TypeScript para la app
├── 🔵 tsconfig.json              # Configuración global TypeScript
├── 🔵 tsconfig.spec.json         # Configuración TypeScript para tests
└── 🔵 arquitectura.md            # Este archivo de documentación
 ```  
## Principios de la arquitectura

**Angular 20 Standalone** permite usar **componentes independientes** sin necesidad de módulos **NgModule**.  

La aplicación se organiza por **carpetas de funcionalidad** (inicio, usuario) y **servicios asociados**.  

El flujo general es: **Componente → Servicio → API Backend**.  

Los archivos **app.routes.ts**, **app.html** y **app.css** definen la **estructura y estilo global**.  

**usuario-service.ts** es un ejemplo de **servicio** que gestiona las **llamadas HTTP** a la API de usuarios.  

---

## Carpetas y archivos principales

### 📁 app/inicio/ y app/usuario/

- **Propósito:** Contener **componentes Standalone** de cada sección.  
- **Qué editar:** **Componentes específicos** para construir la **interfaz**.  
- **Contenido:** Componentes `.ts` con sus **plantillas** y **estilos opcionales**.  

### 📄 app.config.ts

- **Propósito:** Configuraciones **globales** de la app (**URLs de API**, constantes).  
- **Qué editar:** Definir **variables** y **endpoints** usados por los servicios.  

### 📄 app.css / styles.css

- **Propósito:** Definir **estilos globales**.  
- **Qué editar:** **Colores**, **tipografía**, **layout general**.  

### 📄 app.html

- **Propósito:** **Plantilla raíz** de la aplicación.  
- **Qué editar:** **Estructura general**, contenedor principal, `<router-outlet>` si aplica.  

### 📄 app.routes.ts

- **Propósito:** Configuración de **rutas Standalone**.  
- **Qué editar:** Añadir **rutas nuevas**, componentes asociados a cada ruta.  

### 📄 usuario-service.ts

- **Propósito:** **Servicio** para interactuar con **APIs** (**GET, POST, PUT, DELETE**).  
- **Qué editar:** Métodos que consumen el **backend** para cada operación.  

### 📄 main.ts

- **Propósito:** **Punto de entrada** de la aplicación, donde Angular arranca la app.  
- Normalmente no requiere edición.  

### 📄 index.html

- **Propósito:** **Contenedor HTML principal**.  
- **Qué editar:** Etiquetas `<meta>`, **scripts externos**, **favicon**, **título** de la página.  

---

## Flujo de construcción del Front

1. Crear/editar **componentes** en carpetas de funcionalidad (**inicio**, **usuario**).  
2. Configurar **rutas** en **app.routes.ts**.  
3. Definir o actualizar **servicios** para consumir **APIs** (**usuario-service.ts**).  
4. Ajustar **estilos globales** (**app.css / styles.css**).  
5. Configurar **variables globales** o **endpoints** en **app.config.ts**.  
6. Revisar la **plantilla raíz** **app.html** para asegurar que los **componentes se rendericen correctamente**.




Arquitectura propuesta por copilot
src/
└── app/
    ├── auth/                     # Módulo de autenticación
    │   ├── login/                # Componente de login
    │   │   ├── login.ts
    │   │   ├── login.html
    │   │   ├── login.css
    │   ├── registro/             # Componente de registro
    │   │   ├── registro.ts
    │   │   ├── registro.html
    │   │   ├── registro.css
    │   ├── auth.service.ts       # Servicio para autenticación
    │   ├── auth.guard.ts         # Guard para proteger rutas según roles
    │   ├── auth.models.ts        # Modelos relacionados con autenticación
    │   ├── auth.state.ts         # Estado de autenticación (opcional)
    │
    ├── usuario/                  # Módulo de usuarios
    │   ├── usuario-list/         # Componente para listar usuarios (solo admin)
    │   │   ├── usuario-list.ts
    │   │   ├── usuario-list.html
    │   │   ├── usuario-list.css
    │   ├── usuario-form/         # Componente para crear/editar usuarios
    │   │   ├── usuario-form.ts
    │   │   ├── usuario-form.html
    │   │   ├── usuario-form.css
    │   ├── usuario-detail/       # Componente para ver detalles de un usuario
    │   │   ├── usuario-detail.ts
    │   │   ├── usuario-detail.html
    │   │   ├── usuario-detail.css
    │   ├── usuario.service.ts    # Servicio para operaciones CRUD
    │   ├── usuario.models.ts     # Modelos relacionados con usuarios
    │   ├── usuario.state.ts      # Estado centralizado de usuarios (opcional)
    │
    ├── roles/                    # Módulo para manejar roles
    │   ├── admin/                # Componente para el rol de administrador
    │   │   ├── admin.ts
    │   │   ├── admin.html
    │   │   ├── admin.css
    │   ├── user/                 # Componente para el rol de usuario estándar
    │   │   ├── user.ts
    │   │   ├── user.html
    │   │   ├── user.css
    │
    ├── shared/                   # Componentes y servicios reutilizables
    │   ├── botones/              # Componente de botones reutilizables
    │   ├── form/                 # Componente de formularios reutilizables
    │   ├── table/                # Componente de tablas reutilizables
    │   ├── interceptors/         # Interceptores HTTP
    │   ├── pipes/                # Pipes reutilizables
    │   ├── directives/           # Directivas reutilizables
    │
    ├── app.routes.ts             # Rutas principales de la aplicación
    ├── app.config.ts             # Configuración global de la aplicación
