
node {
  ws("workspace/${env.BUILD_TAG}") {
    stage("Clone Repo") {
      checkout scm
      sh "git fetch --tag"
    }
    
    
    env.ISOLATION_ID = sh(returnStdout: true, script: 'printf $BUILD_TAG | sed -e \'s/\\//-/g\'| sha256sum | cut -c1-64').trim()
    env.VERSION=sh(returnStdout: true, script: 'git describe |cut -c 2-').trim()
    
    stage("Clean All Previous Images") {
      sh '''
        for img in $(docker images --filter reference=*:${ISOLATION_ID} --format '{{.Repository}}:{{.Tag}}') \
                    $(docker images --filter reference=*/*:${ISOLATION_ID} --format '{{.Repository}}:{{.Tag}}') ; do
            docker rmi $img
        done
      '''
    } 

    // Run the tests
    stage("Test sextant-api") {
      sh "./test.sh"
    }

    // Build 
    stage("Build sextant-api") {
        sh "docker-compose -f docker-compose.yml build"
    }
    
    stage("Clean Up") {
      sh '''
        for img in $(docker images --filter reference=*:${ISOLATION_ID} --format '{{.Repository}}:{{.Tag}}') \
                    $(docker images --filter reference=*/*:${ISOLATION_ID} --format '{{.Repository}}:{{.Tag}}') ; do
            docker rmi $img
        done
      '''
    }
        
    // Archive Build artifacts
  }
    
}

