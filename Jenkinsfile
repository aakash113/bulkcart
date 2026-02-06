pipeline {
    agent any

    tools {
        nodejs 'node-20'
    }

    stages {
        stage('Install') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') { sh 'npm install' }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') { sh 'npm install' }
                    }
                }
            }
        }

        stage('Test') {
            steps {
                echo 'Running Tests...'
                dir('backend') { sh 'npm run test -- --passWithNoTests' }
            }
        }

        stage('Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') { sh 'npm run build' }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') { sh 'npm run build' }
                    }
                }
            }
        }
    }
}