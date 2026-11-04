IMAGE := docker.io/library/node:26.13.0-trixie-slim

CONTAINER := podman run --rm \
	     --userns=keep-id \
	     --user $(shell id -u):$(shell id -g) \
	     -e HOME=/tmp -e npm_config_cache=/tmp/npm-cache \
	     -v "$(CURDIR):/workspace" \
	     -w /workspace

.PHONY: shell

shell:
	$(CONTAINER) -it $(IMAGE) sh

