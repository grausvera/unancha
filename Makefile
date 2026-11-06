IMAGE := docker.io/library/node:26.13.0-trixie-slim

CONTAINER := podman run --rm \
	     --userns=keep-id \
	     --user $(shell id -u):$(shell id -g) \
	     -e HOME=/tmp -e npm_config_cache=/tmp/npm-cache \
	     -v "$(CURDIR):/workspace" \
	     -w /workspace

RUN := $(CONTAINER) $(IMAGE)

.PHONY: shell audit check pack

shell:
	$(CONTAINER) -it $(IMAGE) sh

audit:
	$(RUN) npm audit --audit-level=moderate

check:
	$(RUN) npm test

pack:
	$(RUN) sh -c 'mkdir -p dist && npm pack --ignore-scripts --pack-destination dist'
