pipeline {
  agent any

  tools {
    nodejs 'node-20'
  }

  environment {
    DOCKER_CREDS = credentials('docker-hub-creds')
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

    stage('Deploy to DEV') {
      when { branch 'staging' }

      environment {
        DEV_HOST = '18.220.122.214'
        DEV_USER = 'ec2-user'
        DEV_APP_DIR = '/home/ec2-user/bulkcart'
      }

      steps {
        sshagent(['dev-ec2-key']) {
          sh '''
            set -e
            echo "Deploying to DEV EC2: $DEV_HOST"

            ssh -o StrictHostKeyChecking=no ${DEV_USER}@${DEV_HOST} << 'EOF'
              set -e
              cd /home/ec2-user/bulkcart

              docker pull aakash113/bulkcart-backend:latest
              docker pull aakash113/bulkcart-frontend:latest

              docker compose down
              docker compose up -d

              docker ps
              echo "Deployment complete."
            EOF
          '''
        }
      }
    }

    stage('TestRigor: DEV Smoke') {
      when { branch 'staging' }

      environment {
        TESTRIGOR_TOKEN = credentials('testrigor-token')
        TESTRIGOR_APPID = credentials('testrigor-appid')
      }

      steps {
        sh '''
          set -e

          echo "Triggering testRigor run..."
          curl -sS -X POST \
            -H "Content-type: application/json" \
            -H "auth-token: ${TESTRIGOR_TOKEN}" \
            "https://api.testrigor.com/api/v1/apps/${TESTRIGOR_APPID}/retest" >/dev/null

          echo "Polling testRigor status..."
          sleep 10

          # Poll up to ~10 minutes (60 x 10s)
          for i in $(seq 1 60); do
            resp=$(curl -sS -i -X GET \
              -H "auth-token: ${TESTRIGOR_TOKEN}" \
              -H "Accept: application/json" \
              "https://api.testrigor.com/api/v1/apps/${TESTRIGOR_APPID}/status")

            code=$(echo "$resp" | awk 'NR==1{print $2}')
            echo "testRigor status HTTP: $code"

            if [ "$code" = "200" ]; then
              echo "✅ testRigor PASS"
              exit 0
            elif [ "$code" = "230" ]; then
              echo "❌ testRigor FAIL"
              exit 1
            elif [ "$code" = "227" ] || [ "$code" = "228" ]; then
              echo "⏳ still running..."
            else
              echo "❌ unexpected status: $code"
              exit 1
            fi

            sleep 10
          done

          echo "❌ testRigor timeout"
          exit 1
        '''
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