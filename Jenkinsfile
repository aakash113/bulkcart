pipeline {
    agent any

    tools {
        nodejs 'node-20'
    }

    environment {
        DB_URL = credentials('BULKCART_DB_URL')
        // This automatically creates DOCKER_CREDS_USR and DOCKER_CREDS_PSW
        DOCKER_CREDS = credentials('DOCKER_HUB_CREDS')
        DOCKER_USER = "aakash113"
    }

    stages {
        stage('Sanity Check') {
            steps {
                sh 'node -v'
                sh 'docker -v'
            }
        }

        stage('CI: Install & Build') {
            // FIX: 'parallel' is now directly under 'stage' (no 'steps' wrapper)
            parallel {
                stage('Backend Build') {
                    steps {
                        dir('backend') {
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
            stage('Frontend Build') {
                steps {
                    dir('frontend') {
                        // FIX: Add --legacy-peer-deps to ignore version strictness
                        sh 'npm install --legacy-peer-deps'
                        sh 'npm run build --configuration=production'
                    }
                }
            }
            }
        }

        stage('CD: Package & Deliver') {
            steps {
                script {
                    // Docker Login using the env variables
                    sh "echo ${DOCKER_CREDS_PSW} | docker login -u ${DOCKER_CREDS_USR} --password-stdin"

                    // Build & Push Backend
                    sh "docker build -t ${DOCKER_USER}/bulkcart-backend:latest ./backend"
                    sh "docker push ${DOCKER_USER}/bulkcart-backend:latest"

                    // Build & Push Frontend
                    sh "docker build -t ${DOCKER_USER}/bulkcart-frontend:latest ./frontend"
                    sh "docker push ${DOCKER_USER}/bulkcart-frontend:latest"
                }
            }
        }
    }

    post {
        always {
            script {
                // Safe cleanup to save space
                if (getContext(hudson.FilePath)) {
                    cleanWs(deleteDirs: true, notFailBuild: true)
                }
            }
        }
    }
}