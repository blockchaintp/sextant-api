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
        sh "docker-compose -f docker-compose.yml build"
      }
    }

    stage("Test") {
      steps {
        withCredentials(){
          sh "./test.sh"
        }
      }
    }

    // Publish

    stage('Create Archives') {
      steps {
        sh '''
            REPO=$(git remote show -n origin | grep Fetch | awk -F'[/.]' '{print $6}')
            VERSION=`git describe --dirty`
            git archive HEAD --format=zip -9 --output=$REPO-$VERSION.zip
            git archive HEAD --format=tgz -9 --output=$REPO-$VERSION.tgz
        '''
      }
    }

  }

  post {
      always {
        sh '''
          for img in `docker images --filter reference="*:$ISOLATION_ID" --format "{{.Repository}}"`; do
            docker rmi -f $img:$ISOLATION_ID
          done
        '''
      }
      success {
          archiveArtifacts '*.tgz, *.zip'
      }
      aborted {
          error "Aborted, exiting now"
      }
      failure {
          error "Failed, exiting now"
      }
  }
}
