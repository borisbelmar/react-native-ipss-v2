# React Native Clean Initial

Starter minimalista de **React Native** con **Expo** + **Expo Router** + **TypeScript**.

Creado para usar como base en proyectos de aplicaciones móviles. Incluye navegación por tabs, estructura de carpetas ordenada y configuración lista para desarrollar.

## Requisitos

- Node.js 18+
- yarn (v1.22.4) — habilitar con Corepack:

```bash
corepack enable
corepack prepare yarn@1.22.4 --activate
```

## Clonar (sin historial git)

```bash
npx degit borisbelmar/react-native-clean-initial mi-app
cd mi-app
yarn install
```

> `degit` descarga el proyecto sin la carpeta `.git`, ideal para empezar desde cero sin historial.

## Iniciar la app

```bash
yarn start
```

Esto abre el menú de Expo. Desde ahí podés abrir la app en:

- **Expo Go** — escaneando el QR con tu celular
- **Emulador Android** — presionando `a`
- **Simulador iOS** — presionando `i` (solo macOS)
- **Web** — presionando `w`

### Comandos directos

```bash
yarn android    # Abrir directamente en emulador Android
yarn ios        # Abrir directamente en simulador iOS
yarn web        # Abrir directamente en el navegador
```

## Estructura del proyecto

```
app/                  # Pantallas y navegación (file-based routing)
  _layout.tsx         # Layout raíz
  (tabs)/             # Grupo de rutas con tabs
    _layout.tsx       # Configuración de los tabs
    index.tsx         # Pantalla de inicio
    explore.tsx       # Pantalla explorar
assets/               # Imágenes, fuentes y otros recursos
components/           # Componentes reutilizables
constants/            # Constantes y configuración
```

## Tecnologías incluidas

| Paquete                       | Versión |
| ----------------------------- | ------- |
| expo                          | ~54.0   |
| expo-router                   | ~6.0    |
| react-native                  | 0.81    |
| react                         | 19.1    |
| typescript                    | ~5.9    |
| @react-navigation/bottom-tabs | ^7.4    |

## Recursos útiles

- [Documentación de Expo](https://docs.expo.dev/)
- [Documentación de Expo Router](https://docs.expo.dev/router/introduction/)
- [Documentación de React Native](https://reactnative.dev/)
