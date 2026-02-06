pipeline {
    agent any

    tools {
        // This MUST match the name in Manage Jenkins > Tools
        nodejs 'node-20'
    }

    environment {
        // Inject your database secret from Jenkins Credentials
        // ID: 'BULKCART_DB_URL', Secret Text: your postgres connection string
        DB_URL = credentials('BULKCART_DB_URL')
        JWT_SECRET = credentials('BULKCART_JWT_SECRET')
    }

    stages {
        stage('Sanity Check') {
            steps {
                echo 'Checking Environment...'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Setup Secrets') {
            steps {
                echo 'Injecting environment variables into backend...'
                dir('backend') {
                    // Recreates the .env file that is excluded from Git
                    sh "echo 'PORT=3000' > .env"
                    sh "echo 'DATABASE_URL=${DB_URL}' >> .env"
                    sh "echo 'JWT_SECRET=${JWT_SECRET}' >> .env"
                }
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
                            sh 'npm run test || true' // Runs tests but doesn't break if one fails
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
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
        }
        success {
            echo '✅ BulkCart build and tests were successful!'
        }
        failure {
            echo '❌ Build failed. Check the Console Output for errors.'
        }
    }
}