.PHONY: instalar check check-python check-web formato test e2e e2e-produccion

instalar:
	python3 -m venv .venv && .venv/bin/pip install -e ".[dev]" && npm ci

check: check-python check-web

check-python:
	ruff check safari rasante tests && ruff format --check safari rasante tests && python -m pytest

check-web:
	npm run check

formato:
	ruff format safari rasante tests && ruff check --fix safari rasante tests && npx prettier --write .

test:
	python -m pytest

e2e:
	npx playwright test

e2e-produccion:
	BASE_URL=$${BASE_URL:?pon BASE_URL=https://…} npx playwright test
