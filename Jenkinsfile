pipeline {
    agent any
    tools {
        nodejs 'node-20'
    }
    environment {
        // This helps debug PATH issues in the console output
        PATH = "${NODEJS_HOME}/bin:${env.PATH}"
    }
    stages {
        stage('Sanity Check') {
            steps {
                // If this fails, the tool 'node-20' is definitely not configured right
                sh 'node -v'
                sh 'npm -v'
            }
        }
        stage('Install Dependencies') {
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
    }
}