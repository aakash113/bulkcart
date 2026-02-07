pipeline {
  agent any

  tools {
    nodejs 'node-20'
  }

  environment {
    DB_URL = credentials('BULKCART_DB_URL')
    // must be a "Username with password" credential in Jenkins
    DOCKER_CREDS = credentials('DOCKER_HUB_CREDS')
    DOCKER_USER  = "aakash113"
  }

  stages {
    stage('Sanity Check') {
      steps {
        sh 'node -v'
        sh 'docker -v'
        sh 'pwd && ls -la'
        sh 'ls -la bulkcart'
      }
    }

    stage('CI: Install & Build') {
      parallel {
        stage('Backend Build') {
          steps {
            dir('bulkcart/backend') {
              sh 'npm ci || npm install'
              sh 'npm run build'
            }
          }
        }

        stage('Frontend Build') {
          steps {
            dir('bulkcart/frontend') {
              sh 'npm ci --legacy-peer-deps || npm install --legacy-peer-deps'
              sh 'npm run build --configuration=production'
            }
          }
        }
      }
    }

    stage('CD: Package & Deliver') {
      steps {
        script {
          sh "echo ${DOCKER_CREDS_PSW} | docker login -u ${DOCKER_CREDS_USR} --password-stdin"

          sh "docker build -t ${DOCKER_USER}/bulkcart-backend:latest bulkcart/backend"
          sh "docker push ${DOCKER_USER}/bulkcart-backend:latest"

          sh "docker build -t ${DOCKER_USER}/bulkcart-frontend:latest bulkcart/frontend"
          sh "docker push ${DOCKER_USER}/bulkcart-frontend:latest"
        }
      }
    }
  }

  post {
    always {
      cleanWs(deleteDirs: true, notFailBuild: true)
    }
  }
}
