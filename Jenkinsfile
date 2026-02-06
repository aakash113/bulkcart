pipeline {
    agent any

    tools {
        nodejs 'node-20'
    }

    environment {
        // Updated syntax to ensure Jenkins binds the secret correctly
        DB_URL = credentials('BULKCART_DB_URL')
    }

    stages {
        stage('Sanity Check') {
            steps {
                echo 'Checking Environment...'
                sh 'node -v'
                // Verification: This will print 'masked' in logs for safety
                sh 'echo "DB URL is loaded"'
            }
        }

        stage('Build & Install') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }
    }

    post {
        always {
            // FIX for 'hudson.FilePath is missing'
            script {
                // Only run cleanWs if a workspace (FilePath) is actually available
                if (getContext(hudson.FilePath)) {
                    cleanWs()
                    echo 'Workspace cleaned successfully.'
                } else {
                    echo 'Workspace already removed, skipping cleanWs.'
                }
            }
        }
        success {
            echo '✅ BulkCart build successful!'
        }
        failure {
            echo '❌ Build failed. Check the Console Output for errors.'
        }
    }
}