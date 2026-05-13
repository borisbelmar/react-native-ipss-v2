# App de Notas — React Native + Expo

> Este documento no solo explica qué hace la app, sino **cómo se pensó cada decisión** mientras la construíamos. Si estás aprendiendo React Native, la idea es que leas esto y entiendas el porqué de cada archivo.
>
> Este README documenta el estado actual del proyecto después de completar la **Unidad 2 (CRUD local con AsyncStorage)** y la **Unidad 3 - Parte A (APIs del dispositivo: cámara, galería y GPS)**.

---

## ¿Qué es esto?

Una app de notas simple pero completa: puedes crear notas, verlas, editarlas y eliminarlas. Las notas pueden incluir **fotos** (desde la cámara o galería) y **ubicación GPS**. Todo se guarda en el teléfono (no necesita internet ni backend) usando AsyncStorage.

Construida con **React Native**, **Expo**, **TypeScript**, **Expo Router**, **AsyncStorage**, **Zod**, **expo-image-picker** y **expo-location**.

---

## El stack — ¿por qué cada herramienta?

| Herramienta | Versión | ¿Para qué la usamos? |
|---|---|---|
| **React Native** | 0.81 | Escribimos una sola app que corre en iOS y Android sin duplicar código |
| **Expo** | SDK 54 | Nos evita tener que instalar Xcode o Android Studio para empezar |
| **Expo Router** | ~6.0 | La navegación se define con archivos y carpetas, como en Next.js |
| **TypeScript** | ~5.9 | El compilador nos avisa si escribimos algo mal antes de correr la app |
| **AsyncStorage** | 2.x | Guarda las notas en el teléfono. Es como `localStorage` pero asíncrono |
| **Zod** | 4.x | Validamos formularios y obtenemos tipos TypeScript automáticamente |
| **expo-image-picker** | 17.x | Acceso a cámara y galería para adjuntar fotos a las notas |
| **expo-location** | 19.x | Acceso al GPS para registrar dónde se creó cada nota |

---

## ¿Cómo empezar?

### Clonar el proyecto

```bash
npx degit borisbelmar/react-native-clean-initial mi-app
cd mi-app
yarn install
```

> `degit` descarga el código sin el historial git. Es útil cuando quieres una base limpia para empezar tu propio proyecto.

### Correr la app

```bash
yarn start      # Abre el servidor de Expo con un QR para escanear
yarn android    # Directo al emulador Android
yarn ios        # Directo al simulador iOS (solo en Mac)
```

Si no tienes `yarn` instalado:

```bash
corepack enable
corepack prepare yarn@1.22.4 --activate
```

---

## Cómo se construyó esto — de cero a CRUD

### Paso 1: Login falso (nuestro primer commit)

La app necesita una puerta de entrada. No vamos a conectar un backend real, así que el login es simulado: si el password es `"1234"`, deja pasar.

**¿Qué creamos?**

- `app/index.tsx` — La pantalla de login con dos campos de texto
- `hooks/useLogin.ts` — Un hook que maneja el formulario y la navegación
- `app/(tabs)/profile.tsx` — La pantalla de perfil con el botón de logout
- Modificamos `app/_layout.tsx` para que el Stack raíz tenga dos pantallas: login y tabs

**¿Cómo funciona la navegación?**

En Expo Router, las rutas se definen con archivos. No hay que configurar un router manualmente. El archivo `app/_layout.tsx` es el contenedor principal:

```
app/
  _layout.tsx         ← Stack raíz
  index.tsx           ← /  (login)
  (tabs)/             ← Grupo de tabs (no aparece en la URL)
    _layout.tsx       ← Tab bar inferior
    index.tsx         ← Inicio
    profile.tsx       ← Perfil
```

El `_layout.tsx` raíz define un Stack con dos pantallas:

```tsx
<Stack>
  <Stack.Screen name="index" options={{ headerShown: false }} />
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
</Stack>
```

Cuando el login es correcto, navegamos a `/(tabs)`. Cuando hacemos logout, reseteamos la pila de navegación para que el usuario no pueda volver atrás:

```tsx
// En profile.tsx — el logout
navigation.getParent()?.dispatch(
  CommonActions.reset({ index: 0, routes: [{ name: "index" }] })
)
```

> **¿Por qué `CommonActions.reset` y no `router.replace("/")`?**
>
> Desde dentro de un tab navigator, `router.replace("/")` a veces resuelve la ruta dentro del grupo de tabs en vez de salir al Stack raíz. El `reset` directo al navigator padre es más confiable.

**Commit:** `feat: add login/logout navigation with profile screen and auth flow`

---

### Paso 2: Tipar antes de codear

Antes de escribir la lógica de las notas, definimos su forma. Esto parece un paso extra, pero en TypeScript es fundamental: si los tipos están claros, el compilador te avisa cuando algo no encaja, incluso antes de correr la app.

```tsx
// types/nota.ts — versión con foto y ubicación

export interface Nota {
  id: string
  titulo: string
  contenido: string
  creadaEn: string
  photoUri?: string          // URI local de la imagen adjunta
  location?: {               // Coordenadas GPS
    latitude: number
    longitude: number
  }
}

// Para crear una nota, solo necesitamos título y contenido
// El id y la fecha los genera el sistema, no el usuario
// photoUri y location son opcionales — no toda nota necesita foto ni GPS
export type CreateNotaInput = Pick<Nota, "titulo" | "contenido" | "photoUri" | "location">

// Para editar, ambos campos son opcionales
// Podés cambiar solo el título, solo el contenido, o ambos
export type UpdateNotaInput = Partial<CreateNotaInput>
```

> **`Pick`** y **`Partial`** son utilidades de TypeScript. En vez de escribir una nueva interfaz con los mismos campos, derivamos los tipos desde `Nota`. Si más adelante cambia la estructura de `Nota`, los tipos derivados se actualizan solos.

---

### Paso 3: Instalar las dependencias

```bash
# AsyncStorage necesita la versión exacta compatible con tu SDK de Expo
npx expo install @react-native-async-storage/async-storage

# Zod no tiene dependencias nativas — se instala directo
yarn add zod
```

> **¿Por qué `expo install` para AsyncStorage?**
>
> `expo install` consulta qué versión del paquete es compatible con el SDK de Expo que tienes instalado. Si usas `yarn add` directo, puedes instalar una versión incompatible y tener errores crípticos en runtime.

#### AsyncStorage: el almacenamiento del teléfono

AsyncStorage guarda pares clave-valor como strings. Como nosotros guardamos arrays de objetos, tenemos que convertirlos a string con `JSON.stringify` al guardar y volver a convertirlos con `JSON.parse` al leer:

```tsx
// Guardar
await AsyncStorage.setItem("notas", JSON.stringify(notas))

// Leer — getItem puede retornar null si la clave no existe
const raw = await AsyncStorage.getItem("notas")
const notas: Nota[] = raw ? JSON.parse(raw) : []
```

> **Error común:** Si intentas hacer `JSON.parse(raw)` sin verificar que `raw` no sea `null`, la app se cae. Siempre valida antes de parsear.

#### Zod: una sola fuente de verdad

Con Zod definimos el esquema una vez y obtenemos los tipos TypeScript automáticamente. No hay que mantener dos lugares separados (validación y tipos):

```tsx
// schemas/nota.schema.ts
import * as z from "zod"

export const createNotaSchema = z.object({
  titulo: z
    .string()
    .min(1, "El título no puede estar vacío")
    .max(100, "Máximo 100 caracteres"),
  contenido: z
    .string()
    .min(1, "El contenido no puede estar vacío"),
})

// Este tipo se infiere del schema — no hay que escribirlo a mano
export type CreateNotaInput = z.infer<typeof createNotaSchema>
```

> **¿Por qué `import * as z` y no `import { z }`?**
>
> En Zod v4 (la que usamos), la forma canónica de importar es `import * as z from "zod"`. Aunque `import { z }` funciona en algunos entornos, no es la forma oficial y puede fallar dependiendo de la configuración del bundler.

---

### Paso 4: Los hooks — donde vive la lógica

La regla de oro de este proyecto: **los componentes solo renderizan, los hooks manejan la lógica**. Si mezclas todo en el componente, se vuelve imposible de leer, de probar y de reutilizar.

#### `useNotes` — todo el CRUD en un solo lugar

Este hook encapsula toda la interacción con AsyncStorage. El componente que lo usa no sabe cómo se guardan los datos — solo llama a `crearNota`, `editarNota` o `eliminarNota`.

```tsx
// hooks/useNotes.ts
export const useNotes = () => {
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar desde AsyncStorage al montar el componente
  const cargarNotas = useCallback(async () => {
    try {
      setLoading(true)
      const raw = await AsyncStorage.getItem("notas")
      setNotas(raw ? JSON.parse(raw) : [])
    } catch {
      setError("No se pudieron cargar las notas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarNotas()
  }, [cargarNotas])

  // AsyncStorage no tiene operaciones de "agregar un elemento".
  // Siempre hay que leer todo, modificar en memoria y escribir todo de vuelta.
  const persistir = async (nuevasNotas: Nota[]) => {
    await AsyncStorage.setItem("notas", JSON.stringify(nuevasNotas))
    setNotas(nuevasNotas)
  }

  const crearNota = async (input: CreateNotaInput) => {
    const nueva: Nota = {
      id: Date.now().toString(),
      ...input,
      creadaEn: new Date().toISOString(),
    }
    await persistir([...notas, nueva])
  }

  const editarNota = async (id: string, input: UpdateNotaInput) => {
    await persistir(
      notas.map(n => n.id === id ? { ...n, ...input } : n)
    )
  }

  const eliminarNota = async (id: string) => {
    await persistir(notas.filter(n => n.id !== id))
  }

  return {
    notas, loading, error,
    crearNota, editarNota, eliminarNota,
    recargar: cargarNotas
  }
}
```

**¿Por qué `useCallback` en `cargarNotas`?**

La función `cargarNotas` se usa como dependencia de `useEffect`. Si no la envuelves en `useCallback`, se recrea en cada render y el `useEffect` se ejecuta en loop infinito.

```tsx
// ❌ Sin useCallback — loop infinito
useEffect(() => { cargarNotas() }, [cargarNotas])
// cargarNotas se recrea en cada render → useEffect corre siempre

// ✅ Con useCallback
const cargarNotas = useCallback(async () => { ... }, [])
// cargarNotas se crea una sola vez → useEffect corre al montar
```

**¿Por qué el hook retorna `loading`, `error` y `recargar`?**

El componente necesita saber si los datos están cargando, si hubo un error, y necesita poder recargar la lista. El hook no decide qué mostrar — solo provee la información.

#### `useNotaForm` — el formulario como hook

Este hook maneja los campos del formulario, los errores de validación y el estado de envío. Funciona tanto para crear (campos vacíos) como para editar (campos pre-llenados).

```tsx
// hooks/useNotaForm.ts
export const useNotaForm = ({ mode, defaultValues, onSubmit }) => {
  const [titulo, setTitulo] = useState(defaultValues?.titulo ?? "")
  const [contenido, setContenido] = useState(defaultValues?.contenido ?? "")
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Problema real que tuvimos:
  // Cuando navegas a la pantalla de edición, AsyncStorage
  // aún no cargó los datos. En el primer render, defaultValues
  // es undefined y el formulario queda vacío.
  // Este efecto sincroniza los campos cuando los datos llegan.
  useEffect(() => {
    if (defaultValues) {
      setTitulo(defaultValues.titulo)
      setContenido(defaultValues.contenido)
    }
  }, [defaultValues?.titulo, defaultValues?.contenido])

  const handleSubmit = async () => {
    const schema = mode === "create" ? createNotaSchema : updateNotaSchema

    // safeParse no lanza excepciones — retorna un objeto con success/error
    const result = schema.safeParse({ titulo, contenido })

    if (!result.success) {
      // flatten() convierte los errores en un objeto plano:
      // { titulo: "El título no puede estar vacío", contenido: "" }
      const flat = result.error.flatten()
      setErrores({
        titulo: flat.fieldErrors.titulo?.[0] ?? "",
        contenido: flat.fieldErrors.contenido?.[0] ?? "",
      })
      return
    }

    setErrores({})
    setSubmitting(true)
    try {
      await onSubmit(result.data)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    titulo, setTitulo,
    contenido, setContenido,
    errores, submitting, handleSubmit
  }
}
```

> **`safeParse` vs `parse`:**
>
> `schema.parse(datos)` lanza una excepción si los datos son inválidos. `schema.safeParse(datos)` retorna un objeto `{ success: true, data: ... }` o `{ success: false, error: ... }`. Con `safeParse` no necesitas un bloque `try/catch` — manejás el error como un valor normal.

---

### Paso 5: Las vistas — conectar los hooks a la pantalla

Con la lógica lista en los hooks, construir las vistas se vuelve mecánico: importar el hook, usar sus valores, y renderizar.

#### Estructura de archivos = rutas

En Expo Router, cada archivo dentro de `app/` es automáticamente una ruta. No hay que configurar un router manualmente.

```
app/
  _layout.tsx              → Stack raíz
  index.tsx                → /  (login)
  (tabs)/                  → Grupo de tabs (no aparece en la URL)
    _layout.tsx            → Tab bar inferior con 2 tabs
    index.tsx              → Redirige a /notes
    notes/                 → Stack interno de notas
      _layout.tsx          → Cabeceras nativas con títulos
      index.tsx            → /notes  (lista)
      create.tsx           → /notes/create  (crear)
      [id]/                → Ruta dinámica: captura el ID de la nota
        index.tsx          → /notes/abc123  (detalle)
        edit.tsx           → /notes/abc123/edit  (editar)
    profile.tsx            → /profile  (perfil + logout)
```

> **¿Por qué `(tabs)` entre paréntesis?**
>
> En Expo Router, los directorios entre paréntesis son **grupos de rutas**. No aparecen en la URL. Sirven para organizar archivos sin afectar la navegación. Sin los paréntesis, la URL sería `/(tabs)/notes` en vez de `/notes`.

#### Cada pantalla tiene una sola responsabilidad

| Pantalla | Archivo | Qué hace |
|---|---|---|
| Lista | `notes/index.tsx` | Muestra todas las notas en un `FlatList`. Botón `+` para crear. Tap para ver detalle. Long press para eliminar rápido. |
| Crear | `notes/create.tsx` | Formulario vacío. Valida con Zod antes de guardar. Al guardar, crea la nota y vuelve. |
| Detalle | `notes/[id]/index.tsx` | Muestra título, fecha y contenido. Dos botones: Editar y Eliminar. |
| Editar | `notes/[id]/edit.tsx` | Formulario pre-llenado con los datos actuales. Valida, guarda y vuelve. |

#### Navegación entre pantallas

```tsx
// Lista → Nueva nota
router.push({ pathname: "/(tabs)/notes/create" })

// Lista → Detalle de una nota
// Pasamos el id como parámetro — Expo Router lo inserta en la URL
router.push({ pathname: "/(tabs)/notes/[id]", params: { id: nota.id } })

// Detalle → Editar
router.push({ pathname: "/(tabs)/notes/[id]/edit", params: { id: nota.id } })

// Volver a la pantalla anterior (funciona desde cualquier pantalla)
router.back()
```

En la pantalla de detalle, leemos el id desde la URL:

```tsx
// app/(tabs)/notes/[id]/index.tsx
const { id } = useLocalSearchParams<{ id: string }>()
const { notas, eliminarNota } = useNotes()
const nota = notas.find(n => n.id === id)
```

> **`useLocalSearchParams` vs `useGlobalSearchParams`:**
>
> `useLocalSearchParams` lee los parámetros de la ruta actual (por ejemplo, el `id` de la nota). `useGlobalSearchParams` lee los parámetros de toda la URL, incluyendo query strings. Para rutas dinámicas como `[id]`, usamos `useLocalSearchParams`.

#### ¿Por qué `useFocusEffect` en la lista?

La lista de notas usa `useFocusEffect` en lugar de `useEffect`:

```tsx
useFocusEffect(
  useCallback(() => {
    void recargar()
  }, [recargar])
)
```

`useEffect` solo corre cuando el componente se monta la primera vez. Si creas una nota y vuelves con `router.back()`, el componente de la lista ya estaba montado — `useEffect` no vuelve a correr y la lista no se actualiza.

`useFocusEffect` corre **cada vez que la pantalla recibe el foco**, incluyendo cuando vuelves desde otra pantalla. Así la lista siempre muestra los datos actualizados.

#### Safe area y notch

Las pantallas con cabecera nativa (crear, detalle, editar) usan `View` simple. El Stack nativo ya maneja automáticamente el espacio del notch y la barra de estado.

La lista, que tiene una cabecera personalizada, usa `SafeAreaView` con `edges={["top"]}` para proteger solo el borde superior del notch, sin agregar padding extra abajo:

```tsx
<SafeAreaView style={styles.screen} edges={["top"]}>
```

> **¿Por qué `edges={["top"]}` y no todas las aristas?**
>
> `SafeAreaView` por defecto agrega padding en todos los bordes (arriba para el notch, abajo para el home indicator). En una lista con `FlatList`, el padding inferior crea un espacio en blanco al desplazarse. Con `edges={["top"]}` solo protegemos el notch y dejamos que el contenido llegue hasta el borde inferior.

---

### Paso 6: El flujo completo

```
Usuario abre la app
        ↓
Login (app/index.tsx)
  El usuario ingresa el password "1234"
  useLogin valida y llama router.push("/(tabs)/notes")
        ↓
Lista de notas (notes/index.tsx)
  useFocusEffect dispara recargar() al recibir foco
  useNotes carga las notas desde AsyncStorage
  FlatList renderiza una tarjeta por cada nota
        ↓
     ┌────────────────────────────────────────┐
     ↓                                        ↓
  Tap en "+"                           Tap en una nota
  router.push(".../create")            router.push(".../[id]")
        ↓                                        ↓
  Crear nota                              Detalle de nota
  Formulario vacío                        Muestra título y contenido
  Zod valida al guardar                   Botón Editar → ".../[id]/edit"
  crearNota() → AsyncStorage              Botón Eliminar → Alert → eliminarNota()
  router.back()                           router.back()
        ↓                                        ↓
        └────────────────────────────────────────┘
                            ↓
            Lista se recarga (useFocusEffect dispara recarga)
```

---

### Paso 7: APIs del dispositivo — cámara, galería y GPS

En la Unidad 3 extendimos la app para acceder al hardware del teléfono. Las notas ahora pueden llevar foto adjunta y coordenadas GPS.

#### ¿Qué cambió en el modelo de datos?

`Nota` se extendió con dos campos opcionales. Son opcionales (`?`) porque no toda nota necesita foto ni ubicación — una nota de texto simple sigue funcionando igual que antes.

```typescript
export interface Nota {
  id: string
  titulo: string
  contenido: string
  creadaEn: string
  photoUri?: string           // file:///data/.../photo.jpg
  location?: {
    latitude: number          // -33.4489
    longitude: number         // -70.6693
  }
}
```

#### El sistema de permisos en Expo

El hardware del teléfono (cámara, GPS) no está disponible libremente. El sistema operativo exige que la app **pida permiso al usuario** antes de acceder.

```typescript
// Patrón estándar para cualquier permiso en Expo
const { status } = await ImagePicker.requestCameraPermissionsAsync()
if (status !== "granted") {
  // El usuario rechazó — nunca explotar sin permiso
  return
}
// El usuario aceptó — proceder con el hardware
```

**Regla de oro:** Nunca asumas que tienes el permiso. El usuario puede revocarlo desde la configuración del teléfono en cualquier momento.

#### Instalación

```bash
npx expo install expo-image-picker
npx expo install expo-location
```

> **¿Por qué `npx expo install` en vez de `yarn add`?** `expo install` elige automáticamente la versión compatible con tu SDK de Expo. Si usas `yarn add` directo puedes instalar una versión incompatible y tener errores difíciles de diagnosticar.

#### `useImagePicker` — cámara y galería

`hooks/useImagePicker.ts` encapsula el acceso a la cámara y galería con manejo de permisos.

```typescript
export const useImagePicker = () => {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError("Se necesita acceso a la galería")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    })
    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
      setError(null)
    }
  }

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      setError("Se necesita acceso a la cámara")
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    })
    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
      setError(null)
    }
  }

  const clearImage = () => setImageUri(null)

  return { imageUri, error, pickFromGallery, takePhoto, clearImage }
}
```

> **`result.canceled` vs `result.cancelled`:** Usa `canceled` (sin doble l). La versión antigua de la librería usaba `cancelled` — si ves ese error en código viejo, es esto.

#### `useLocation` — GPS

`hooks/useLocation.ts` obtiene las coordenadas actuales del dispositivo.

```typescript
export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentLocation = async () => {
    setLoading(true)
    setError(null)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setError("Se necesita permiso para acceder a la ubicación")
        return
      }
      const loc = await Location.getCurrentPositionAsync({})
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      })
    } catch {
      setError("No se pudo obtener la ubicación")
    } finally {
      setLoading(false)
    }
  }

  const clearLocation = () => setLocation(null)

  return { location, loading, error, getCurrentLocation, clearLocation }
}
```

> **Solo foreground:** Usamos `requestForegroundPermissionsAsync`, no `requestBackgroundPermissionsAsync`. Es suficiente para registrar dónde se creó la nota — no necesitamos ubicación en segundo plano.

#### Cómo se integran en la pantalla de crear nota

Los hooks `useImagePicker` y `useLocation` se usan de forma independiente en `create.tsx`. Al hacer submit, sus valores se convierten en campos opcionales del objeto `Nota`:

```typescript
const { imageUri, takePhoto, pickFromGallery, clearImage } = useImagePicker()
const { location, getCurrentLocation, clearLocation } = useLocation()

const form = useNotaForm({
  mode: "create",
  onSubmit: async (data) => {
    await crearNota({
      ...(data as CreateNotaInput),
      photoUri: imageUri ?? undefined,
      location: location ?? undefined,
    })
    router.back()
  },
})
```

El hook `useNotes` no necesita saber nada de cámara ni GPS. Solo recibe el objeto y lo persiste en AsyncStorage con los campos que vengan. **Eso es exactamente lo que hace valiosa la arquitectura de custom hooks.**

#### Cómo se muestran en la pantalla de detalle

En `[id]/index.tsx`, si la nota tiene foto o ubicación, se renderizan condicionalmente:

```typescript
{nota.photoUri && (
  <>
    <Text style={styles.sectionTitle}>Foto</Text>
    <Image source={{ uri: nota.photoUri }} style={styles.image} />
  </>
)}

{nota.location && (
  <>
    <Text style={styles.sectionTitle}>Ubicación</Text>
    <View style={styles.locationRow}>
      <IconSymbol name="location.fill" size={16} color={colors.muted} />
      <Text>{nota.location.latitude.toFixed(4)}, {nota.location.longitude.toFixed(4)}</Text>
    </View>
  </>
)}
```

En la lista (`note-item.tsx`), las notas con foto o ubicación muestran badges indicadores con íconos de cámara y ubicación.

#### Errores frecuentes — Parte A

| Error | Causa | Solución |
|---|---|---|
| `Permission denied` en cámara | No se pidió permiso antes de `launchCameraAsync` | Siempre llama `requestCameraPermissionsAsync()` primero |
| La foto no persiste al cerrar la app | No se guardó `photoUri` en la nota | Incluir `photoUri` en el objeto `Nota` al crear |
| `getCurrentPositionAsync` demora mucho | El GPS tarda en obtener señal | Mostrar un loading mientras se obtiene |
| `result.cancelled` (doble l) es undefined | API antigua, la propiedad cambió | Usar `result.canceled` (sin doble l) |

Cada capa del proyecto tiene una sola responsabilidad. Si mezclas lógica en el componente, se vuelve difícil de entender:

| Capa | Archivo(s) | Qué hace |
|---|---|---|
| **Tipos** | `types/nota.ts` | Define la forma de los datos. Una sola fuente de verdad. |
| **Validación** | `schemas/nota.schema.ts` | Reglas de negocio de los formularios. Zod genera los tipos. |
| **CRUD** | `hooks/useNotes.ts` | Lee y escribe en AsyncStorage. Patrón read-modify-write. |
| **Formulario** | `hooks/useNotaForm.ts` | Estado, errores y submit. Valida con Zod antes de enviar. |
| **Cámara/Galería** | `hooks/useImagePicker.ts` | Permisos, captura de foto y selección de galería. |
| **GPS** | `hooks/useLocation.ts` | Permisos de ubicación y obtención de coordenadas. |
| **Vistas** | `app/(tabs)/notes/*.tsx` | Renderiza la UI y captura eventos del usuario. |
| **Navegación** | `*/_layout.tsx` | Define rutas, transiciones y cabeceras. |

---

## Errores comunes que encontramos

| Error | Causa | Solución |
|---|---|---|
| `JSON.parse` lanza error | `getItem` retornó `null` | Verificar: `raw ? JSON.parse(raw) : []` |
| La lista no se actualiza al volver | `useEffect` no se re-ejecuta | Usar `useFocusEffect` para recargar al recibir foco |
| El formulario de edición queda vacío | `defaultValues` llega después del primer render | Agregar `useEffect` en `useNotaForm` para sincronizar |
| Hooks en orden diferente entre renders | Llamar hooks condicionalmente (después de un `if`) | Siempre llamar todos los hooks antes de cualquier `return` |
| El teclado tapa los inputs | Falta `KeyboardAvoidingView` | Envolver el formulario con `KeyboardAvoidingView` |
| Botón volver dice "index" | La pantalla anterior no tiene título definido | Usar `headerBackTitle` en el `_layout.tsx` |

---

## Comandos de referencia

```bash
yarn start          # Servidor de desarrollo con menú de Expo
yarn android        # Directo al emulador Android
yarn ios            # Directo al simulador iOS (solo Mac)
yarn web            # Abrir en el navegador
yarn lint           # Verificar estilo de código
npx tsc --noEmit    # Verificar tipos de TypeScript

# Instalar paquetes con versión compatible al SDK
npx expo install expo-image-picker
npx expo install expo-location

# Limpiar caché si hay problemas
npx expo start --clear
```

## Recursos útiles

- [Documentación de Expo](https://docs.expo.dev/)
- [Documentación de Expo Router](https://docs.expo.dev/router/introduction/)
- [Documentación de AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Documentación de Zod](https://zod.dev)
- [expo-image-picker — Docs oficiales](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [expo-location — Docs oficiales](https://docs.expo.dev/versions/latest/sdk/location/)
- [React Native — Core Components](https://reactnative.dev/docs/components-and-apis)
- [React — Hooks API](https://react.dev/reference/react)
