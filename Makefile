.DEFAULT_GOAL := help

# Motor de contenedores instalado en el equipo. Los targets usan Podman sin privilegios.
PODMAN ?= podman
# Imagen con la versión de Node.js usada para compilar y comprobar el paquete.
NODE_IMAGE ?= docker.io/library/node:26.13.0-trixie-slim
# Biblioteca de materiales que se monta en solo lectura durante la importación.
MATERIALS_DIR ?= $(abspath ../material/unancha/library)
# Selecciones de importación separadas por espacios, en formato icons/id=Component.
ICONS ?=
# Tarball anterior con el que se comparan las revisiones. Se indica una ruta dentro del proyecto.
BASELINE ?=

# Pasa los argumentos del usuario como datos, sin interpolarlos en los comandos internos.
export ICONS BASELINE

# Conserva el UID del propietario y monta únicamente el proyecto en modo escritura.
CONTAINER = $(PODMAN) run --rm --userns=keep-id \
	--volume "$(CURDIR):/workspace" --workdir /workspace \
	--env NPM_CONFIG_CACHE=/tmp/unancha-npm-cache

# NPM_CONFIG_CACHE mantiene la caché de npm dentro del contenedor temporal.
# Lee la versión de pnpm del manifiesto raíz y la usa solo dentro del contenedor.
RUN_PNPM = sh -ec 'pnpm_spec=$$(node -p "require(\"./package.json\").packageManager"); exec npm exec --yes --package="$$pnpm_spec" -- "$$@"' --

# Desactiva el envío de métricas de Next.js en los comandos locales de la web.
WEB_CONTAINER = $(CONTAINER) --env NEXT_TELEMETRY_DISABLED=1

.PHONY: help install dev build test import-icons release

# Muestra las tareas y sus argumentos sin arrancar Podman.
help:
	@printf '%s\n' \
		'make install                           Install locked dependencies' \
		'make dev                               Start the website on localhost:3000' \
		'make build                             Build the library and production website' \
		'make test                              Build and test the library' \
		'make import-icons ICONS="icons/sun=Sun"  Import selected material icons' \
		'make release [BASELINE=previous.tgz]     Prepare and verify a local release candidate'

# Instala dependencias según el archivo de bloqueo y las conserva en el workspace montado.
install:
	$(CONTAINER) $(NODE_IMAGE) $(RUN_PNPM) pnpm install --frozen-lockfile

# Compila la biblioteca y abre toda la web en el puerto local 3000. Requiere las dependencias instaladas.
dev:
	$(WEB_CONTAINER) --publish 127.0.0.1:3000:3000 $(NODE_IMAGE) \
		$(RUN_PNPM) sh -ec 'pnpm build; pnpm --filter @grausvera/unancha-web dev'

# Genera la biblioteca, copia los SVG y compila la web de producción. Requiere las dependencias instaladas.
build:
	$(WEB_CONTAINER) $(NODE_IMAGE) \
		$(RUN_PNPM) sh -ec 'pnpm build; pnpm --filter @grausvera/unancha-web build'

# Reconstruye el paquete y ejecuta las pruebas. Requiere las dependencias instaladas.
test:
	$(CONTAINER) $(NODE_IMAGE) $(RUN_PNPM) pnpm test

# Escribe el manifiesto y las revisiones nuevas del paquete a partir del montaje de solo lectura.
import-icons:
	$(CONTAINER) --env ICONS --volume "$(MATERIALS_DIR):/library:ro" $(NODE_IMAGE) \
		$(RUN_PNPM) sh -ec 'set -f; pnpm --dir packages/unancha import:icons /library $$ICONS'

# Instala dependencias, compara revisiones si se indica BASELINE y escribe el candidato validado en artifacts/.
release:
	$(CONTAINER) --env BASELINE $(NODE_IMAGE) \
		$(RUN_PNPM) sh -ec 'pnpm install --frozen-lockfile; node packages/unancha/tooling/prepare-release.mjs "$$BASELINE"'
