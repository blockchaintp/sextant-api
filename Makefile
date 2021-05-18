export ISOLATION_ID ?= local
PWD = $(shell pwd)

REPO ?= $(shell git remote show -n origin | grep Fetch | awk -F'[/.]' '{print $$3}' )
BRANCH_NAME ?= $(shell git symbolic-ref -q HEAD )
VERSION ?= $(shell git describe --dirty)

UID := $(shell id -u)
GID := $(shell id -g)

.PHONY: all clean build test test_npm test_pmd archive

all: clean build test archive

build:
	docker-compose -f docker-compose.yml build
	docker-compose -f docker-compose.test.yml build

test:  test_npm test_pmd

test_npm:
	docker-compose -f docker-compose.test.yml up -d
	docker-compose -f docker-compose.test.yml exec -T api npm run test
	docker-compose -f docker-compose.test.yml down -v || true
	docker-compose -f docker-compose.test.yml rm -f || true

test_pmd:
	mkdir -p build/pmd
	docker run -v $$(pwd)/src:/src rawdee/pmd pmd \
		-R rulesets/ecmascript/basic.xml -d /src -f xml -min 1 \
		--failOnViolation false \
		-l ecmascript | sed -e 's@name=\"/src@name=\"src@'> build/pmd.xml
	docker run -v $(pwd)/src:/src rawdee/pmd cpd --minimum-tokens 100 \
		--exclude /src/deployment_templates \
		--failOnViolation false \
		--files /src --language ecmascript --format xml > build/cpd.xml

clean:
	docker-compose -f docker-compose.test.yml down -v || true
	docker-compose -f docker-compose.test.yml rm -f || true
	docker-compose -f docker-compose.yml down -v || true
	docker-compose -f docker-compose.yml rm -f || true
	rm -rf build

archive:
	git archive HEAD --format=zip -9 --output=build/$(REPO)-$(VERSION).zip
	git archive HEAD --format=tgz -9 --output=build/$(REPO)-$(VERSION).tgz
