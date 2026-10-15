# CHEMORA — site + 3D lab game
# Usage: `make help`
#
# Layout:  ./            static learning site + serverless API (api/)
#          ./game/       Vite/React/Three.js lab game (pnpm project)
#          ./dist/       deployable output: site at /, game at /play/

SHELL      := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

NODE  ?= node
NPM   ?= npm
PORT  ?= 4173
DIST  := dist
GAME  := game

.PHONY: help install dev dev-site dev-game build build-game assemble \
        validate test test-site test-game typecheck lint verify preview \
        check-tools clean distclean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | sed -E 's/^([a-zA-Z_-]+):.*## (.*)$$/\1|\2/' | while IFS='|' read -r t d; do printf '  \033[36m%-12s\033[0m %s\n' "$$t" "$$d"; done

check-tools: ## Verify required tools are installed
	@command -v $(NODE) >/dev/null || { echo "node is required (>=22)"; exit 1; }
	@command -v $(NPM) >/dev/null || { echo "npm is required"; exit 1; }
	@$(NODE) -e 'const m=+process.versions.node.split(".")[0]; if(m<22){console.error("Node >=22 required, found "+process.version);process.exit(1)}'

install: check-tools ## Install all dependencies (root and game)
	npm install --no-audit --no-fund --legacy-peer-deps
	cd $(GAME) && npm install --no-audit --no-fund --legacy-peer-deps

dev: dev-game ## Alias for dev-game

dev-game: ## Run the game dev server (http://localhost:5173/)
	cd $(GAME) && $(NPM) run dev

dev-site: ## Serve the static site only (http://localhost:4173/)
	$(NODE) scripts/serve.mjs . $(PORT)

validate: ## Validate site structure, links, challenge data, game wiring
	$(NODE) scripts/validate-project.mjs

test-site: validate ## Site checks: validator, API smoke test, experiments regression
	$(NODE) scripts/smoke-api.mjs
	$(NODE) scripts/test-experiments.mjs

typecheck: ## Typecheck the game
	cd $(GAME) && $(NPM) run typecheck

lint: ## Lint the game
	cd $(GAME) && $(NPM) run lint

test-game: ## Unit-test the game (chemistry engine)
	cd $(GAME) && $(NPM) run test

test: test-site test-game ## Run every test

build-site: ## Production build of the React application
	$(NPM) run build

build-game: ## Production build of the game (base path /play/)
	cd $(GAME) && $(NPM) run build

assemble: ## Combine site + built game into dist/
	$(NODE) scripts/assemble-dist.mjs $(DIST) $(GAME)/dist

build: install build-site build-game assemble ## Full production build -> dist/ (used by Vercel)
	$(NODE) scripts/verify-dist.mjs $(DIST)

verify: validate test-site typecheck lint test-game build ## Everything CI runs, in order

preview: ## Serve dist/ locally exactly as deployed (http://localhost:4173/)
	@test -d $(DIST) || { echo "dist/ missing - run 'make build' first"; exit 1; }
	$(NODE) scripts/serve.mjs $(DIST) $(PORT)

clean: ## Remove build output
	rm -rf $(DIST) $(GAME)/dist

distclean: clean ## Also remove installed dependencies
	rm -rf $(GAME)/node_modules node_modules
