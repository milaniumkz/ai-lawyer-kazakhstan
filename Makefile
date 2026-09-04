FLUTTER ?= /Volumes/PD1000/job/flutter/bin/flutter

.PHONY: bootstrap format lint typecheck test build docker-config release-check

bootstrap:
	npm install
	$(FLUTTER) pub get --directory apps/mobile

format:
	dart format apps/mobile/lib apps/mobile/test

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm test
	$(FLUTTER) test --directory apps/mobile
	python3 -m py_compile services/ai/app/main.py

build:
	npm run build

docker-config:
	docker compose -f infra/docker-compose.yml config

release-check:
	npm run release-check
