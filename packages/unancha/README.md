# Unancha

Lleva a tu proyecto los 341 iconos de la colección Forma. Cada icono tiene una variante de contorno y otra sólida. Puedes ajustar su tamaño y color, o descargar el SVG de una revisión exacta.

## Instalación

Instala Unancha desde npm.

```sh
npm install @grausvera/unancha
```

En React y Next.js puedes empezar directamente.

```tsx
import { Sun } from "@grausvera/unancha/icons";

<Sun variant="filled" width={24} height={24} color="#7c3aed" />
```

Usa `variant="line"` para el contorno predeterminado o `variant="filled"` para el sólido. El tamaño se ajusta con `width` y `height`. El color hereda `currentColor`, así que también lo puedes controlar desde CSS.

## Integración por framework

Configura el adaptador una vez y conserva `@grausvera/unancha/icons` en tus imports.

| Proyecto | Configuración |
| --- | --- |
| React 18.2 o 19, Next.js | Usa el adaptador predeterminado. |
| Vue 3 | [Vite](#vite) con `unancha-vue`. |
| Nuxt | [Alias de Vue](#nuxt). |
| Svelte 5 y SvelteKit | [Vite](#vite) con `unancha-svelte`. |
| Astro 5.7, 6 o 7 | [Configuración de Astro](#astro). |
| Angular 22 | [Condición de Angular](#angular). |
| JavaScript o TypeScript | [Vite](#vite) con `unancha-web` y [API del navegador](#javascript-y-typescript). |

En los proyectos que gestionan su propio `tsconfig.json`, añade la condición del adaptador a `compilerOptions.customConditions` para resolver sus tipos. Usa `moduleResolution` con `bundler`, `node16` o `nodenext`.

### Vite

Integra este bloque en tu `vite.config.js` o `vite.config.ts` y conserva la configuración existente. Cambia `condition` por la de tu proyecto. `noExternal` permite que Vite aplique el mismo adaptador al renderizar en el servidor.

```js
const condition = "unancha-vue";

const vite = {
  resolve: { conditions: ["module", "browser", "development|production", condition] },
  ssr: {
    noExternal: ["@grausvera/unancha"],
    resolve: { conditions: ["module", "node", "development|production", condition] },
  },
};

export default vite;
```

En Vue importa el icono dentro de `<script setup>`. En Svelte, impórtalo dentro de `<script>`. En ambos casos puedes usar `<Sun variant="filled" width="24" height="24" />` en la plantilla.

### Nuxt

Añade el alias y la condición de tipos en `nuxt.config.ts`. Usa los mismos imports y componentes que en Vue.

```ts
export default defineNuxtConfig({
  alias: { "@grausvera/unancha/icons": "@grausvera/unancha/vue" },
  typescript: {
    tsConfig: { compilerOptions: { customConditions: ["unancha-vue"] } },
  },
});
```

### Astro

En `astro.config.mjs`, aplica el bloque de [Vite](#vite) con `unancha-astro` dentro de la propiedad `vite`. Agrega también la misma resolución al renderizado y al prerenderizado de Astro.

```js
const resolve = {
  conditions: ["module", "node", "development|production", "unancha-astro"],
  noExternal: ["@grausvera/unancha"],
};

// Incorpora estos entornos a la propiedad vite de tu configuración.
const environments = {
  astro: { resolve },
  prerender: { resolve },
};
```

Asigna `environments` dentro de la propiedad `vite`, junto con `resolve` y `ssr`. En un archivo `.astro`, importa el icono entre los delimitadores `---` y úsalo como componente en la plantilla.

### Angular

En `angular.json`, añade `unancha-angular` a `options.conditions` del target `build` que usa `@angular/build:application`. Si corres un servidor con Node.js que importa el paquete sin empaquetarlo, usa `--conditions=unancha-angular`.

Añade el icono a los `imports` del componente y aplica su selector a un `svg`.

```ts
import { Component } from "@angular/core";
import { Sun } from "@grausvera/unancha/icons";

@Component({
  selector: "app-icon",
  imports: [Sun],
  template: '<svg unanchaSun variant="filled" [attr.width]="24" [attr.height]="24"></svg>',
})
export class IconComponent {}
```

### JavaScript y TypeScript

Con `unancha-web`, crea un SVG en el navegador. También puedes importar desde `@grausvera/unancha/web` para seleccionar ese adaptador directamente.

```js
import { createIcon, Sun } from "@grausvera/unancha/icons";

document.body.append(createIcon(Sun, { variant: "filled", width: 24, height: 24 }));
```

## SVG, revisiones y accesibilidad

- **SVG directo.** Copia un archivo de `@grausvera/unancha/assets/*` a tu sitio y úsalo con `<img>`. También puedes insertar el SVG en el HTML para controlar su color con CSS.
- **Revisiones.** Consulta una versión exacta con `getAssetVersion({ assetId: "icons/sun", variant: "line", revision: 1 })` desde `@grausvera/unancha/catalogue`. Su SVG está en `@grausvera/unancha/assets/icons/line/sun.r1.svg`.
- **Accesibilidad.** Los iconos son decorativos por defecto. Si un botón contiene solo un icono, asigna el nombre accesible al botón. Si el SVG comunica información por sí solo, usa `role="img"`, `aria-hidden="false"` y `aria-label`. En React usa `aria-hidden={false}` y en Angular `[attr.aria-hidden]="false"`.
- **Animación.** Importa `@grausvera/unancha/motion.css` y aplica `unancha-icon-spin` o `unancha-icon-pulse`. Ambas clases respetan la preferencia de movimiento reducido.

## Licencia

Los SVG y el código del paquete se distribuyen bajo la licencia MIT.
