pipeline {
    agent any

    tools {
        nodejs 'node-20'
    }

    stages {
        stage('Sanity Check') {
            steps {
                // This prints the version to the console to prove it exists
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