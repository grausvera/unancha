# Unancha

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="presentation/cover-dark.svg">
    <img src="presentation/cover-light.svg" alt="unancha" width="100%">
</picture>

Una biblioteca de recursos para dar forma a lo que estás creando

## Qué incluye

SVG para interfaces e ilustraciones y un catálogo para consultar sus nombres, rutas y etiquetas.

## Instalación

```sh
npm install --ignore-scripts https://github.com/grausvera/unancha/releases/download/v0.1.0/grausvera-unancha-0.1.0.tgz
```

El paquete de esta versión se distribuye mediante GitHub Releases.

## Uso básico

```js
import { getAsset } from "@grausvera/unancha";

const sun = getAsset("icons/sun");
console.log(sun.file);
```

`catalogue` y `getAsset` se importan desde `@grausvera/unancha`. Los SVG originales se incluyen en el paquete; el consumidor decide qué archivos servir desde su web. El campo file no es una URL pública automática.

## Desarrollo

Las herramientas del proyecto se ejecutan en Podman. `make check` ejecuta las comprobaciones disponibles. La carpeta `examples/` contiene las revisiones visuales locales de desarrollo y queda fuera del paquete instalable.

## Licencia

Código y gráficos originales bajo MIT. Las marcas conservan sus condiciones; consultar THIRD_PARTY_NOTICES.md y third-party/.
