.PHONY: up test health tests

up:
	docker-compose up -d

test:
	docker-compose run --rm tests

health:
	docker-compose run --rm tests tests/test_health.py::test_health_check -q -x