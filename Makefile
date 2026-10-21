# CHEMORA — Chemistry Learning Platform
# Usage: `make help`

SHELL      := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

NODE  ?= node
NPM   ?= npm
PORT  ?= 3000
DIST  := dist

.PHONY: help install dev build assemble \
        validate test test-site verify preview \
        check-tools clean distclean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | sed -E 's/^([a-zA-Z_-]+):.*## (.*)$$/\1|\2/' | while IFS='|' read -r t d; do printf '  \033[36m%-12s\033[0m %s\n' "$$t" "$$d"; done

check-tools: ## Verify required tools are installed
	@command -v $(NODE) >/dev/null || { echo "node is required (>=22)"; exit 1; }
	@command -v $(NPM) >/dev/null || { echo "npm is required"; exit 1; }
	@$(NODE) -e 'const m=+process.versions.node.split(".")[0]; if(m<22){console.error("Node >=22 required, found "+process.version);process.exit(1)}'

install: check-tools ## Install all dependencies
	npm install --no-audit --no-fund --legacy-peer-deps

dev: ## Run the development server
	$(NPM) run dev

validate: ## Validate site structure, links, challenge data
	$(NODE) scripts/validate-project.mjs

test-site: validate ## Site checks: validator, API smoke test, experiments regression
	$(NODE) scripts/smoke-api.mjs
	$(NODE) scripts/test-experiments.mjs

test: test-site ## Run all test suites

build-site: ## Production build of the React application
	$(NPM) run build:site

assemble: ## Combine site into dist/
	$(NODE) scripts/assemble-dist.mjs $(DIST)

build: build-site assemble ## Full production build -> dist/
	$(NODE) scripts/verify-dist.mjs $(DIST)

verify: validate test-site build ## Everything CI runs, in order

preview: ## Serve dist/ locally
	@test -d $(DIST) || { echo "dist/ missing - run 'make build' first"; exit 1; }
	$(NODE) scripts/serve.mjs $(DIST) $(PORT)

clean: ## Remove build output
	rm -rf $(DIST) dist-site

distclean: clean ## Also remove installed dependencies
	rm -rf node_modules
