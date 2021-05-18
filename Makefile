export ISOLATION_ID ?= local
PWD = $(shell pwd)

REPO ?= $(shell git remote show -n origin | grep Fetch | awk -F'[/.]' '{print $$3}' )
BRANCH_NAME ?= $(shell git symbolic-ref -q HEAD )
VERSION ?= $(shell git describe --dirty)

UID := $(shell id -u)
GID := $(shell id -g)

PMD_IMAGE = blockchaintp/pmd:latest

.PHONY: all clean build test test_npm test_pmd archive dirs

all: clean build test archive

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

clean:
	docker-compose -f docker-compose.test.yml rm -f || true
	docker-compose -f docker-compose.test.yml down -v --rmi all || true
	docker-compose -f docker-compose.yml rm -f || true
	docker-compose -f docker-compose.yml down -v --rmi all || true
	rm -rf build

archive: dirs
	git archive HEAD --format=zip -9 --output=build/$(REPO)-$(VERSION).zip
	git archive HEAD --format=tgz -9 --output=build/$(REPO)-$(VERSION).tgz
