MAKEFILE_DIR := $(dir $(lastword $(MAKEFILE_LIST)))
include $(MAKEFILE_DIR)/standard_defs.mk

PMD_IMAGE = blockchaintp/pmd:latest

build: $(MARKERS)/build_docker

test: $(MARKERS)/test_jest $(MARKERS)/test_tape

analyze: analyze_fossa analyze_sonar_js

clean: fix_permissions clean_container
clean_dirs_standard: fix_permissions

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

$(MARKERS)/test_tape: $(MARKERS)/build_docker
	docker-compose -f docker-compose.test.yml up -d
	docker-compose -f docker-compose.test.yml exec -T api npm run test || true
	mkdir -p build/tape
	docker cp api_test:/tmp/test.out ./build/tape/results.tap || true
	docker cp api_test:/tmp/junit.xml ./build/tape/junit.xml || true
	docker cp api_test:/tmp/lcov.info ./build/tape/ || true
	docker cp api_test:/tmp/lcov-report ./build/tape/ || true
	docker-compose -f docker-compose.test.yml down -v || true
	docker-compose -f docker-compose.test.yml rm -f || true
	touch $@

$(MARKERS)/test_jest: $(MARKERS)/build_docker
	docker run -w /app/api --rm -v $$(pwd)/build:/app/api/build \
		-v /var/run/docker.sock:/var/run/docker.sock \
		--network host \
		--entrypoint bash sextant-api:$(ISOLATION_ID) -c "npm run test:jest"
	$(BUSYBOX_ROOT) chown -R $(UID):$(GID) /project
	touch $@

test: $(MARKERS)/test_report_merge
$(MARKERS)/test_report_merge: $(MARKERS)/test_jest $(MARKERS)/test_tape
	docker run -w /app/api --rm -v $$(pwd)/build:/app/api/build \
		--entrypoint bash sextant-api:$(ISOLATION_ID) -c "npm run merge:junit"
	docker run -w /app/api --rm -v $$(pwd)/build:/app/api/build \
		--entrypoint bash sextant-api:$(ISOLATION_ID) -c "npm run merge:coverage"
	touch $@

$(MARKERS)/build_npm_ci: $(MARKERS)/asdf
	npm ci
	touch $@

.PHONY: docs
docs:
	mkdir -p docs/api
	docker run --rm -v $(PWD)/docs/api:/app/api/build \
		sextant-api:$(ISOLATION_ID) run generate-swagger
	$(BUSYBOX_ROOT) find /project -type d -exec chown -R $(UID):$(GID) {} \;
	find docs/api -type f -exec sed -i 's/[ \t]*$$//' {} \;

update-helm-fixtures: build
	docker run -it --rm --entrypoint bash -w /app/api \
		-v $(PWD)/test/fixtures:/app/api/test/fixtures \
		sextant-api:$(ISOLATION_ID) -c " \
			npm run download-helm-charts && \
			tar -cvzf /tmp/helmCharts.tar.gz helmCharts && \
			cp /tmp/helmCharts.tar.gz /app/api/test/fixtures/helmCharts.tar.gz \
		"

.PHONY: run-local
run-local: $(MARKERS)/build_docker
	docker-compose -f docker-compose.localtest.yml up -d
	docker logs -f api_test | npx pino-pretty

.PHONY: stop-local
stop-local:
	docker-compose -f docker-compose.localtest.yml down
	rm -f $(MARKERS)/build_docker

.PHONY: clean-local
clean-local:
	docker-compose -f docker-compose.localtest.yml down -v
	rm -f $(MARKERS)/build_docker

export ASDF_DIR ?= $(HOME)/.asdf
export ASDF_BIN ?= $(ASDF_DIR)/bin
export ASDF_USER_SHIMS ?= $(ASDF_DIR)/shims
export PATH := $(ASDF_BIN):$(PATH)
export PATH := $(ASDF_USER_SHIMS):$(PATH)
$(MARKERS)/asdf_installed:
	if [ ! -d $(ASDF_DIR)/.git ]; then \
		git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.11.2; \
		asdf update; \
		asdf plugin update --all; \
	fi
	touch $@

$(MARKERS)/asdf_plugins: $(MARKERS)/asdf_installed
	if [ -r .tool-versions ]; then \
		cat .tool-versions | awk '{print $$1}' | xargs -n1 asdf plugin add || true ;\
	fi
	if [ -r $(HOME)/.tool-versions ]; then \
		cat $(HOME)/.tool-versions | awk '{print $$1}' | xargs -n1 asdf plugin add || true ;\
	fi
	touch $@

$(MARKERS)/asdf: $(MARKERS)/asdf_plugins
	asdf install
	asdf current
	touch $@
