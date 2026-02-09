pipeline {
  agent any

  tools {
    nodejs 'node-20'
  }

  environment {
//     DB_URL = credentials('BULKCART_DB_URL')
    DOCKER_CREDS = credentials('docker-hub-creds') // username+password
    DOCKER_USER  = "aakash113"
  }

  stages {
    stage('Sanity Check') {
      steps {
        sh 'node -v'
        sh 'docker -v'
        sh 'pwd'
        sh 'ls -la'
        sh 'ls -la backend frontend'
      }
    }


    stage('CI: Install & Build') {
      parallel {
        stage('Backend Build') {
          steps {
            dir('backend') {
              sh 'npm ci'
              sh 'npm run build'
            }
          }
        }

        stage('Frontend Build') {
          steps {
            dir('frontend') {
              sh 'npm ci --legacy-peer-deps'
              sh 'npm run build -- --configuration=production'
            }
          }
        }
      }
    }

    stage('CD: Package & Deliver') {
      steps {
        script {
          sh 'echo "$DOCKER_CREDS_PSW" | docker login -u "$DOCKER_CREDS_USR" --password-stdin'

          sh "docker build -t ${DOCKER_USER}/bulkcart-backend:latest backend"
          sh "docker push ${DOCKER_USER}/bulkcart-backend:latest"

          sh "docker build -t ${DOCKER_USER}/bulkcart-frontend:latest frontend"
          sh "docker push ${DOCKER_USER}/bulkcart-frontend:latest"
        }
      }
    }
  }

  post {
    always {
      script {
        try {
          cleanWs(deleteDirs: true, notFailBuild: true)
        } catch (e) {
          echo "cleanWs skipped: ${e}"
        }
      }
    }
  }

}
