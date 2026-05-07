# App de Notas — React Native + Expo

> Este documento no solo explica qué hace la app, sino **cómo se pensó cada decisión** mientras la construíamos. Si estás aprendiendo React Native, la idea es que leas esto y entiendas el porqué de cada archivo.

---

## ¿Qué es esto?

Una app de notas simple pero completa: puedes crear notas, verlas, editarlas y eliminarlas. Todo se guarda en el teléfono (no necesita internet ni backend) usando AsyncStorage.

Construida con **React Native**, **Expo**, **TypeScript**, **Expo Router**, **AsyncStorage** y **Zod**.

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
// types/nota.ts

export interface Nota {
  id: string
  titulo: string
  contenido: string
  creadaEn: string
}

// Para crear una nota, solo necesitamos título y contenido
// El id y la fecha los genera el sistema, no el usuario
export type CreateNotaInput = Pick<Nota, "titulo" | "contenido">

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

## Responsabilidades separadas

Cada capa del proyecto tiene una sola responsabilidad. Si mezclas lógica en el componente, se vuelve difícil de entender:

| Capa | Archivo(s) | Qué hace |
|---|---|---|
| **Tipos** | `types/nota.ts` | Define la forma de los datos. Una sola fuente de verdad. |
| **Validación** | `schemas/nota.schema.ts` | Reglas de negocio de los formularios. Zod genera los tipos. |
| **CRUD** | `hooks/useNotes.ts` | Lee y escribe en AsyncStorage. Patrón read-modify-write. |
| **Formulario** | `hooks/useNotaForm.ts` | Estado, errores y submit. Valida con Zod antes de enviar. |
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
```

## Recursos útiles

- [Documentación de Expo](https://docs.expo.dev/)
- [Documentación de Expo Router](https://docs.expo.dev/router/introduction/)
- [Documentación de AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Documentación de Zod](https://zod.dev)
- [React Native — Core Components](https://reactnative.dev/docs/components-and-apis)
- [React — Hooks API](https://react.dev/reference/react)
