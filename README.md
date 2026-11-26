<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/logo-dark.svg">
    <img alt="Unancha" src="apps/web/public/logo.svg" width="560">
  </picture>
</p>

<p align="center">341 iconos de la colección Forma para diseñar y construir interfaces.</p>

## La colección Forma

- **Explorador.** Encuentra un icono por nombre o categoría, compara sus variantes de contorno y sólido y copia el código con tus ajustes.
- **Estudio.** Prueba el icono con tus colores, fondos y bordes, y exporta el resultado en SVG o PNG.
- **Revisiones.** Comparte un enlace al dibujo exacto que usaste, aunque el icono se actualice.

## Instalación

Instala Unancha desde npm.

```sh
npm install @grausvera/unancha
```

Por ejemplo, en React o Next.js puedes usar el icono Sol en su variante sólida.

```tsx
import { Sun } from "@grausvera/unancha/icons";

<Sun variant="filled" width={24} height={24} color="#7c3aed" />
```

Usa `@grausvera/unancha/icons` también en **Vue, Nuxt, Svelte, SvelteKit, Astro, Angular, JavaScript y TypeScript**. Encuentra la configuración de tu proyecto en la [guía de integración por framework](packages/unancha/README.md#integración-por-framework).

## Prueba el Explorador y el Estudio

Con Podman, ejecuta `make install` y `make dev` desde la raíz del repositorio. Luego abre `http://127.0.0.1:3000`.

## Licencia

Los iconos de Forma se distribuyen bajo la [licencia MIT](packages/unancha/LICENSE).
