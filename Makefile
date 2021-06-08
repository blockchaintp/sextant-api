MAKEFILE_DIR := $(dir $(lastword $(MAKEFILE_LIST)))
include $(MAKEFILE_DIR)/standard_defs.mk

PMD_IMAGE = blockchaintp/pmd:latest

build: $(MARKERS)/build_docker

test: $(MARKERS)/test_npm test_pmd

analyze: analyze_sonar_generic

clean: clean_container

distclean: clean_docker

package: package_docs

$(MARKERS)/build_docker:
	docker-compose -f docker-compose.yml build
	docker-compose -f docker-compose.test.yml build
	touch $@

.PHONY: clean_container
clean_container:
	docker-compose -f docker-compose.test.yml rm -f || true
	docker-compose -f docker-compose.yml rm -f || true

.PHONY: clean_docker
clean_docker:
	docker-compose -f docker-compose.test.yml down -v --rmi all || true
	docker-compose -f docker-compose.yml down -v --rmi all || true

$(MARKERS)/test_npm:
	docker-compose -f docker-compose.test.yml up -d
	docker-compose -f docker-compose.test.yml exec -T api npm run test
	docker cp api_test:/tmp/test.out ./build/sextant-api.tape.txt
	docker-compose -f docker-compose.test.yml down -v || true
	docker-compose -f docker-compose.test.yml rm -f || true
	touch $@

test_pmd:
	docker run --rm -v $$(pwd)/src:/src $(PMD_IMAGE) pmd \
		-R /usr/local/rulesets/ecmascript/btp_basic.xml \
		-d /src -f xml -min 1 \
		--failOnViolation false \
		-l ecmascript | sed -e 's@name=\"/src@name=\"src@'> build/pmd.xml
	docker run --rm -v $(pwd)/src:/src $(PMD_IMAGE) cpd --minimum-tokens 100 \
		--exclude /src/deployment_templates \
		--failOnViolation false \
		--files /src --language ecmascript --format xml > build/cpd.xml

.PHONY: package_docs
package_docs:
	mkdir -p docs/api
	docker run --rm -v $(PWD)/docs/api:/app/api/build \
		sextant-api:$(ISOLATION_ID) run generate-swagger
	$(BUSYBOX) find /project -type d -exec chown -R $(UID):$(GID) {} \;
