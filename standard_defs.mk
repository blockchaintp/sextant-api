export ISOLATION_ID ?= local
PWD = $(shell pwd)

ORGANIZATION ?= $(shell git remote show -n origin | grep Fetch | \
													awk '{print $$NF}' | sed -e 's/git@github.com://' | \
													sed -e 's@https://github.com/@@' | \
													awk -F'[/.]' '{print $$1}' )
REPO ?= $(shell git remote show -n origin | grep Fetch | awk '{print $$NF}' | \
									sed -e 's/git@github.com://' | \
									sed -e 's@https://github.com/@@' | \
									awk -F'[/.]' '{print $$2}' )
BRANCH_NAME ?= $(shell git symbolic-ref -q HEAD |sed -e \
												's@refs/heads/@@')
SAFE_BRANCH_NAME ?= $(shell if [ -n "$$BRANCH_NAME" ]; then\
															echo $$BRANCH_NAME; \
														else \
															git symbolic-ref -q HEAD|sed -e \
																's@refs/heads/@@'|sed -e 's@/@_@g'; \
														fi)
PR_KEY = $(shell echo $(BRANCH_NAME) | cut -c4- )
VERSION ?= $(shell git describe | cut -c2- )
LONG_VERSION ?= $(shell git describe --long --dirty |cut -c2- )
UID := $(shell id -u)
GID := $(shell id -g)

MARKERS = markers

##
# SonarQube0
##
SONAR_HOST_URL ?= https://sonarqube.dev.catenasys.com
SONAR_AUTH_TOKEN ?=

##
# Maven related settings
##
MAVEN_SETTINGS ?= $(HOME)/.m2/settings.xml
MAVEN_REVISION != if [ "$(LONG_VERSION)" = "$(VERSION)" ] || \
	(echo "$(LONG_VERSION)" | grep -q dirty); then \
		if command -v semver; then \
			echo `bin/semver bump patch $(VERSION)`-SNAPSHOT; \
		else \
			echo $(VERSION); \
		fi \
	else \
		echo $(VERSION); \
	fi

MAVEN_REPO_BASE ?= https://dev.catenasys.com/repository/catenasys-maven
MAVEN_REPO_TARGET != if [ "$(LONG_VERSION)" = "$(VERSION)" ] || \
	(echo "$(LONG_VERSION)" | grep -q dirty); then \
		echo snapshots; \
	else \
		echo releases; \
	fi
MAVEN_UPDATE_RELEASE_INFO != if [ "$(LONG_VERSION)" = "$(VERSION)" ] || \
	(echo "$(LONG_VERSION)" | grep -q dirty); then \
		echo false; \
	else \
		echo true; \
	fi
MAVEN_DEPLOY_TARGET = \
	$(MAVEN_REPO_TARGET)::default::$(MAVEN_REPO_BASE)-$(MAVEN_REPO_TARGET)

##
# BEGIN Standardized directives
##

##
# Standard targets
##

# A complete build sequence
.PHONY: all
all: build test package analyze archive

# Clean everything but the docker images
.PHONY: clean
clean: clean_dirs

# Clean everything and the docker image, leaving the repo pristine
.PHONY: distclean
distclean: clean

# All compilation tasks
.PHONY: build
build: dirs

# All tasks which produce a test result
.PHONY: test
test: build

# Produce packages
.PHONY: package
package: build

# Linting, Static Analysis, Test Analysis and reporting
.PHONY: analyze
analyze: test

# Archive the source code
.PHONY: archive
archive: dirs archive_git

# Any prerequisite directories, which should also be gitignored
.PHONY: dirs
dirs: dirs_standard

# Any publishing to external systems other than docker registries, e.g. Maven
.PHONY: publish
publish: package


# Maven Version of Sonar Analysis
.PHONY: analyze_sonar_mvn
analyze_sonar_mvn: package
	[ -z "$(SONAR_AUTH_TOKEN)" ] || \
	$(DOCKER_MVN) sonar:sonar \
			-Dsonar.projectKey=$(ORGANIZATION)_$(REPO):$(SAFE_BRANCH_NAME) \
			-Dsonar.projectName="$(ORGANIZATION)/$(REPO) $(SAFE_BRANCH_NAME)" \
			-Dsonar.projectVersion=$(VERSION) \
			-Dsonar.host.url=$(SONAR_HOST_URL) \
			-Dsonar.login=$(SONAR_AUTH_TOKEN)

.PHONY: analyze_sonar_generic
analyze_sonar_generic:
	[ -z "$(SONAR_AUTH_TOKEN)" ] || \
		if [ -z "$(CHANGE_BRANCH)" ]; then \
			docker run \
				--rm \
				-v $$(pwd):/usr/src \
				sonarsource/sonar-scanner-cli \
					-Dsonar.organization=$(ORGANIZATION) \
					-Dsonar.projectKey=$(ORGANIZATION)_$(REPO) \
					-Dsonar.projectName="$(ORGANIZATION)/$(REPO)" \
					-Dsonar.branch.name=$(BRANCH_NAME) \
					-Dsonar.projectVersion=$(VERSION) \
					-Dsonar.host.url=$(SONAR_HOST_URL) \
					-Dsonar.login=$(SONAR_AUTH_TOKEN) \
					-Dsonar.junit.reportPaths=**/target/surefire-reports; \
		else \
			docker run \
				--rm \
				-v $$(pwd):/usr/src \
				sonarsource/sonar-scanner-cli \
					-Dsonar.organization=$(ORGANIZATION) \
					-Dsonar.projectKey=$(ORGANIZATION)_$(REPO) \
					-Dsonar.projectName="$(ORGANIZATION)/$(REPO)" \
					-Dsonar.pullrequest.key=$(BRANCH_NAME) \
					-Dsonar.pullrequest.branch=$(CHANGE_BRANCH) \
					-Dsonar.pullrequest.base=$(CHANGE_TARGET) \
					-Dsonar.projectVersion=$(VERSION) \
					-Dsonar.host.url=$(SONAR_HOST_URL) \
					-Dsonar.login=$(SONAR_AUTH_TOKEN) \
					-Dsonar.junit.reportPaths=**/target/surefire-reports; \
		fi

.PHONY: analyze_sonar_js
analyze_sonar_js:
	[ -z "$(SONAR_AUTH_TOKEN)" ] || \
		if [ -z "$(CHANGE_BRANCH)" ]; then \
			docker run \
				--rm \
				-v $$(pwd):/usr/src \
				sonarsource/sonar-scanner-cli \
					-Dsonar.organization=$(ORGANIZATION) \
					-Dsonar.projectKey=$(ORGANIZATION)_$(REPO) \
					-Dsonar.projectName="$(ORGANIZATION)/$(REPO)" \
					-Dsonar.branch.name=$(BRANCH_NAME) \
					-Dsonar.projectVersion=$(LONG_VERSION) \
					-Dsonar.host.url=$(SONAR_HOST_URL) \
					-Dsonar.login=$(SONAR_AUTH_TOKEN) \
					-Dsonar.sources=src \
					-Dsonar.tests=test \
					-Dsonar.junit.reportPaths=build/junit.xml \
					-Dsonar.javascript.lcov.reportPaths=build/lcov.info; \
		else \
			docker run \
				--rm \
				-v $$(pwd):/usr/src \
				sonarsource/sonar-scanner-cli \
					-Dsonar.organization=$(ORGANIZATION) \
					-Dsonar.projectKey=$(ORGANIZATION)_$(REPO) \
					-Dsonar.projectName="$(ORGANIZATION)/$(REPO)" \
					-Dsonar.pullrequest.key=$(PR_KEY) \
					-Dsonar.pullrequest.branch=$(CHANGE_BRANCH) \
					-Dsonar.pullrequest.base=$(CHANGE_TARGET) \
					-Dsonar.projectVersion=$(LONG_VERSION) \
					-Dsonar.host.url=$(SONAR_HOST_URL) \
					-Dsonar.login=$(SONAR_AUTH_TOKEN) \
					-Dsonar.sources=src \
					-Dsonar.tests=test \
					-Dsonar.junit.reportPaths=build/junit.xml \
					-Dsonar.javascript.lcov.reportPaths=build/lcov.info; \
		fi

.PHONY: archive_git
archive_git: build/$(REPO)-$(VERSION).zip build/$(REPO)-$(VERSION).tgz

build/$(REPO)-$(VERSION).zip:
	if [ -d .git ]; then \
		git archive HEAD --format=zip -9 --output=build/$(REPO)-$(VERSION).zip; \
	fi

build/$(REPO)-$(VERSION).tgz:
	if [ -d .git ]; then \
		git archive HEAD --format=zip -9 --output=build/$(REPO)-$(VERSION).tgz; \
	fi

##
# Docker based toolchain
##
TOOLCHAIN := docker run --rm -v $(HOME)/.m2/repository:/root/.m2/repository \
		-v $(MAVEN_SETTINGS):/root/.m2/settings.xml -v `pwd`:/project \
		toolchain:$(ISOLATION_ID)
DOCKER_MVN := $(TOOLCHAIN) mvn -Drevision=$(MAVEN_REVISION) -B
BUSYBOX := docker run --rm -v $(HOME)/.m2/repository:/root/.m2/repository \
		-v $(MAVEN_SETTINGS):/root/.m2/settings.xml -v $(PWD):/project \
		busybox:latest

$(MARKERS)/build_toolchain_docker: dirs
	if [ -r docker/toolchain.docker ]; then \
		docker build -f docker/toolchain.docker -t toolchain:$(ISOLATION_ID) . ; \
	fi
	touch $@

.PHONY: fix_permissions
fix_permissions:
	$(BUSYBOX) chown -R $(UID):$(GID) /root/.m2/repository
	$(BUSYBOX) find /project -type d -name target -exec chown \
		-R $(UID):$(GID) {} \;

# This will reset the build status possible causing steps to rerun
.PHONY: clean_markers
clean_markers:
	rm -rf $(MARKERS)/*

$(MARKERS)/build_mvn: $(MARKERS)/build_toolchain_docker
	$(DOCKER_MVN) compile
	touch $@

$(MARKERS)/package_mvn: $(MARKERS)/build_toolchain_docker
	$(DOCKER_MVN) package verify
	touch $@

$(MARKERS)/clean_mvn: $(MARKERS)/build_toolchain_docker
	$(DOCKER_MVN) clean

$(MARKERS)/test_mvn: $(MARKERS)/build_toolchain_docker
	$(DOCKER_MVN) test
	touch $@

$(MARKERS)/publish_mvn: $(MARKERS)/build_toolchain_docker
	$(DOCKER_MVN) -Drevision=0.0.0 versions:set -DnewVersion=$(MAVEN_REVISION)
	$(DOCKER_MVN) clean deploy -DupdateReleaseInfo=$(MAVEN_UPDATE_RELEASE_INFO) \
		-DaltDeploymentRepository=$(MAVEN_DEPLOY_TARGET)

# Any prerequisite directories, which should also be gitignored
.PHONY: dirs_standard
dirs_standard:
	mkdir -p build
	mkdir -p $(MARKERS)

.PHONY: clean_dirs_standard
clean_dirs_standard:
	rm -rf build
	rm -rf $(MARKERS)

.PHONY: clean_dirs
clean_dirs: clean_dirs_standard

$(MARKERS)/check_ignores:
	git check-ignore build
	git check-ignore $(MARKERS)
	touch $@
##
# END Standardized directives
##