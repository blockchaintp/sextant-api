MAKEFILE_DIR := $(dir $(lastword $(MAKEFILE_LIST)))
include $(MAKEFILE_DIR)/standard_defs.mk

PMD_IMAGE = blockchaintp/pmd:latest

build: $(MARKERS)/build_docker

test: $(MARKERS)/test_npm

analyze: analyze_fossa analyze_sonar_js

clean: clean_container

distclean: clean_docker clean_npm

$(MARKERS)/build_docker:
	docker-compose -f docker-compose.yml build
	docker-compose -f docker-compose.test.yml build
	touch $@

.PHONY: clean_container
clean_container:
	docker-compose -f docker-compose.test.yml down -v || true
	docker-compose -f docker-compose.yml down -v || true
	docker-compose -f docker-compose.test.yml rm -f || true
	docker-compose -f docker-compose.yml rm -f || true

.PHONY: clean_docker
clean_docker:
	docker-compose -f docker-compose.test.yml down -v --rmi all || true
	docker-compose -f docker-compose.yml down -v --rmi all || true

.PHONY: clean_npm
clean_npm:
	rm -rf node_modules

$(MARKERS)/test_npm:
	docker-compose -f docker-compose.test.yml up -d
	docker-compose -f docker-compose.test.yml exec -T api npm run test || true
	docker cp api_test:/tmp/test.out ./build/results.tap || true
	docker cp api_test:/tmp/junit.xml ./build/junit.xml || true
	docker cp api_test:/tmp/lcov.info ./build/ || true
	docker cp api_test:/tmp/lcov-report ./build/ || true
	docker-compose -f docker-compose.test.yml down -v || true
	docker-compose -f docker-compose.test.yml rm -f || true
	touch $@

.PHONY: docs
docs:
	mkdir -p docs/api
	docker run --rm -v $(PWD)/docs/api:/app/api/build \
		sextant-api:$(ISOLATION_ID) run generate-swagger
	$(BUSYBOX) find /project -type d -exec chown -R $(UID):$(GID) {} \;
	find docs/api -type f -exec sed -i 's/[ \t]*$$//' {} \;
