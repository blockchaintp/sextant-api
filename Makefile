export ISOLATION_ID ?= local
PWD = $(shell pwd)

ORGANIZATION ?= $(shell git remote show -n origin | grep Fetch | \
												awk '{print $$NF}' | \
												sed -e 's/git@github.com://' | \
												sed -e 's@https://github.com/@@' | \
												awk -F'[/.]' '{print $$1}' )
REPO ?= $(shell git remote show -n origin | grep Fetch | \
												awk '{print $$NF}' | \
												sed -e 's/git@github.com://' | \
												sed -e 's@https://github.com/@@' | \
												awk -F'[/.]' '{print $$2}' )

BRANCH_NAME ?= $(shell git symbolic-ref -q HEAD )
SAFE_BRANCH_NAME ?= $(shell if [ -n "$$BRANCH_NAME" ]; then echo $$BRANCH_NAME; else \
														git symbolic-ref -q HEAD|sed -e \
														's@refs/heads/@@'|sed -e 's@/@_@g'; \
														fi)
VERSION ?= $(shell git describe | cut -c2-  )
LONG_VERSION ?= $(shell git describe --long --dirty |cut -c2- )
UID := $(shell id -u)
GID := $(shell id -g)

SONAR_HOST_URL ?= https://sonarqube.dev.catenasys.com
SONAR_AUTH_TOKEN ?= $(SONAR_AUTH_TOKEN)
PMD_IMAGE = blockchaintp/pmd:latest

.PHONY: all clean build test test_npm test_pmd archive dirs analyze analyze_sonar

all: clean build test archive

what:
	echo $(ORGANIZATION)
	echo $(REPO)
dirs:
	mkdir -p build

build:
	docker-compose -f docker-compose.yml build
	docker-compose -f docker-compose.test.yml build

test:  test_npm test_pmd

test_npm: dirs
	docker-compose -f docker-compose.test.yml up -d
	docker-compose -f docker-compose.test.yml exec -T api npm run test
	docker cp api_test:/tmp/test.out ./build/sextant-api.tape.txt
	docker-compose -f docker-compose.test.yml down -v || true
	docker-compose -f docker-compose.test.yml rm -f || true

test_pmd: dirs
	docker run -v $$(pwd)/src:/src $(PMD_IMAGE) pmd \
		-R /usr/local/rulesets/ecmascript/btp_basic.xml \
		-d /src -f xml -min 1 \
		--failOnViolation false \
		-l ecmascript | sed -e 's@name=\"/src@name=\"src@'> build/pmd.xml
	docker run -v $(pwd)/src:/src $(PMD_IMAGE) cpd --minimum-tokens 100 \
		--exclude /src/deployment_templates \
		--failOnViolation false \
		--files /src --language ecmascript --format xml > build/cpd.xml

analyze: analyze_sonar

analyze_sonar:
	[ -z "$(SONAR_AUTH_TOKEN)" ] || \
	docker run \
		--rm \
		-v $$(pwd):/usr/src \
		sonarsource/sonar-scanner-cli \
			-Dsonar.projectKey=$(ORGANIZATION)_$(REPO):$(SAFE_BRANCH_NAME) \
			-Dsonar.projectName="$(ORGANIZATION)/$(REPO) $(SAFE_BRANCH_NAME)" \
			-Dsonar.projectVersion=$(VERSION) \
			-Dsonar.host.url=$(SONAR_HOST_URL) \
			-Dsonar.login=$(SONAR_AUTH_TOKEN)

clean:
	docker-compose -f docker-compose.test.yml rm -f || true
	docker-compose -f docker-compose.test.yml down -v --rmi all || true
	docker-compose -f docker-compose.yml rm -f || true
	docker-compose -f docker-compose.yml down -v --rmi all || true
	rm -rf build

archive: dirs
	git archive HEAD --format=zip -9 --output=build/$(REPO)-$(VERSION).zip
	git archive HEAD --format=tgz -9 --output=build/$(REPO)-$(VERSION).tgz
