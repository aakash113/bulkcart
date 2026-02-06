pipeline {
    agent any
    tools { nodejs 'node-20' }

    environment {
        DB_URL = credentials('BULKCART_DB_URL')
        DOCKER_CREDS = credentials('DOCKER_HUB_CREDS')
        DOCKER_USER = "your-docker-hub-username"
    }

    stages {
        stage('CI: Install & Build') {
            steps {
                parallel {
                    stage('Backend') { steps { dir('backend') { sh 'npm install && npm run build' } } }
                    stage('Frontend') { steps { dir('frontend') { sh 'npm install && npm run build' } } }
                }
            }
        }

        stage('CD: Package & Deliver') {
            steps {
                script {
                    // Login to Docker Hub
                    sh "echo ${DOCKER_CREDS_PSW} | docker login -u ${DOCKER_CREDS_USR} --password-stdin"

                    // Build and Push Backend
                    sh "docker build -t ${DOCKER_USER}/bulkcart-backend:latest ./backend"
                    sh "docker push ${DOCKER_USER}/bulkcart-backend:latest"

                    // Build and Push Frontend
                    sh "docker build -t ${DOCKER_USER}/bulkcart-frontend:latest ./frontend"
                    sh "docker push ${DOCKER_USER}/bulkcart-frontend:latest"
                }
            }
        }
    }

    post {
        always {
            script {
                if (getContext(hudson.FilePath)) { cleanWs() }
            }
        }
    }
}