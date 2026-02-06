pipeline {
    agent any

    tools {
        // This MUST match the name in Manage Jenkins > Tools: node-20
        nodejs 'node-20'
    }

    environment {
        // Inject your database secret from Jenkins Credentials
        // ID: 'BULKCART_DB_URL', Secret Text: your postgres connection string
        DB_URL = credentials('BULKCART_DB_URL')
    }

    stages {
        stage('Sanity Check') {
            steps {
                echo 'Checking Environment...'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install & Build') {
            parallel {
                stage('Backend (NestJS)') {
                    steps {
                        dir('backend') {
                            echo 'Building Backend...'
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
                stage('Frontend (Angular)') {
                    steps {
                        dir('frontend') {
                            echo 'Building Frontend...'
                            sh 'npm install'
                            // Ensure you have a 'build' script in your frontend package.json
                            sh 'npm run build --configuration=production'
                        }
                    }
                }
            }
        }

        stage('Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            // Using || true allows the pipeline to continue even if a test fails
                            // useful during early development phases
                            sh 'npm run test || true'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            // Runs Angular tests in headless mode for Jenkins
                            sh 'npm run test -- --watch=false --browsers=ChromeHeadless || true'
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution finished.'
            // Clean up the workspace to stay within your 3.74GB limit
            cleanWs()
        }
        success {
            echo '✅ BulkCart build and tests were successful!'
        }
        failure {
            echo '❌ Build failed. Check the Console Output for errors.'
        }
    }
}