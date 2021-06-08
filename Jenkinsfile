#!groovy

// Copyright 2019 Blockchain Technology Partners
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ------------------------------------------------------------------------------


pipeline {
  agent any

  triggers {cron('H H * * *')}


  options {
    ansiColor('xterm')
    timestamps()
    buildDiscarder(logRotator(daysToKeepStr: '31'))
  }

  environment {
    ISOLATION_ID = sh(returnStdout: true, script: 'echo $BUILD_TAG | sha256sum | cut -c1-64').trim()
  }

  stages {
    stage('Fetch Tags') {
      steps {
        checkout([$class: 'GitSCM', branches: [[name: "${GIT_BRANCH}"]],
            doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [],
            userRemoteConfigs: [[credentialsId: 'github-credentials',noTags:false, url: "${GIT_URL}"]],
            extensions: [
                  [$class: 'CloneOption',
                  shallow: false,
                  noTags: false,
                  timeout: 60]
            ]])
      }
    }

    stage('Build') {
      steps {
        sh '''
          make clean build
        '''
      }
    }

    stage("Test") {
      steps {
        withCredentials([usernamePassword(credentialsId: 'btp-build-nexus', passwordVariable: 'BTP_DEV_PSW', usernameVariable: 'BTP_DEV_USR')]) {
          sh '''
            make test
          '''
          step([$class: "TapPublisher", testResults: "build/results.tap"])
        }
      }
    }

    stage('Package') {
      steps {
        sh '''
          make package
        '''
      }
    }

    stage("Analyze") {
      steps {
        withSonarQubeEnv('sonarcloud') {
          sh '''
            make analyze
          '''
        }
        waitForQualityGate abortPipeline: true
      }
    }

    stage('Create Archives') {
      steps {
        sh '''
          make archive
        '''
      }
    }

    stage('Publish') {
      steps {
        sh '''
          make publish
        '''
      }
    }
  }

  post {
      always {
        // recordIssues enabledForFailure: true, tools: [mavenConsole(), java(), javaDoc()]
        // recordIssues enabledForFailure: true, tool: checkStyle()
        // recordIssues enabledForFailure: true, tool: spotBugs()
        recordIssues enabledForFailure: true, tool: cpd(pattern: '**/build/cpd.xml')
        recordIssues enabledForFailure: true, tool: pmdParser(pattern: '**/build/pmd.xml')
      }
      success {
        echo "Successfully completed"
      }
      aborted {
        error "Aborted, exiting now"
      }
      failure {
        error "Failed, exiting now"
      }
  }
}
