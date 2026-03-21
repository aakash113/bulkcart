pipeline {
  agent any

  tools {
    nodejs 'node-20'
  }

  environment {
    DOCKER_CREDS  = credentials('docker-hub-creds')
    DOCKER_USER   = "aakash113"
    SLACK_WEBHOOK = credentials('slack-webhook')
    APP_NAME      = "BulkCart"
  }

  stages {
    stage('Notify Start') {
      steps {
        script {
          def targetEnv = (env.BRANCH_NAME == 'main') ? 'DEV' : (env.BRANCH_NAME == 'staging' ? 'QA' : env.BRANCH_NAME)

          sh """
            curl -sS -X POST -H 'Content-type: application/json' \
            --data '{
              "text":"🚀 ${APP_NAME} pipeline started | Env: ${targetEnv} | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}"
            }' \
            "${SLACK_WEBHOOK}"
          """
        }
      }
    }

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

          if (env.BRANCH_NAME == 'main') {
            sh "docker build -t ${DOCKER_USER}/bulkcart-backend:dev backend"
            sh "docker push ${DOCKER_USER}/bulkcart-backend:dev"
            sh "docker build -t ${DOCKER_USER}/bulkcart-frontend:dev frontend"
            sh "docker push ${DOCKER_USER}/bulkcart-frontend:dev"
          }

          if (env.BRANCH_NAME == 'staging') {
            sh "docker build -t ${DOCKER_USER}/bulkcart-backend:qa backend"
            sh "docker push ${DOCKER_USER}/bulkcart-backend:qa"
            sh "docker build -t ${DOCKER_USER}/bulkcart-frontend:qa frontend"
            sh "docker push ${DOCKER_USER}/bulkcart-frontend:qa"
          }
        }
      }
    }

    stage('Deploy to DEV') {
      when { branch 'main' }

      environment {
        DEV_HOST    = '18.220.122.214'
        DEV_USER    = 'ec2-user'
        DEV_APP_DIR = '/home/ec2-user/bulkcart'
      }

      steps {
        sshagent(['dev-ec2-key']) {
          sh '''
            set -e
            echo "Deploying to DEV EC2: $DEV_HOST"

            ssh -o StrictHostKeyChecking=no ${DEV_USER}@${DEV_HOST} << EOF
              set -e
              cd ${DEV_APP_DIR}

              docker pull aakash113/bulkcart-backend:dev
              docker pull aakash113/bulkcart-frontend:dev

              docker compose down
              docker compose up -d

              docker ps
              echo "DEV deployment complete."
            EOF
          '''
        }
      }
    }

    stage('Deploy to QA') {
      when { branch 'staging' }

      environment {
        QA_HOST    = '18.222.163.244'
        QA_USER    = 'ec2-user'
        QA_APP_DIR = '/home/ec2-user/bulkcart'
      }

      steps {
        sshagent(['qa-ec2-key']) {
          sh '''
            set -e
            echo "Deploying to QA EC2: $QA_HOST"

            ssh -o StrictHostKeyChecking=no ${QA_USER}@${QA_HOST} << EOF
              set -e
              cd ${QA_APP_DIR}

              docker pull aakash113/bulkcart-backend:qa
              docker pull aakash113/bulkcart-frontend:qa

              docker compose down
              docker compose up -d

              docker ps
              echo "QA deployment complete."
            EOF
          '''
        }
      }
    }

    stage('TestRigor: DEV Smoke') {
      when { branch 'main' }

      environment {
        TESTRIGOR_TOKEN = credentials('testrigor-token')
        TESTRIGOR_APPID = credentials('testrigor-appid-dev')
      }

      steps {
        sh '''
          set -e
          echo "Triggering DEV testRigor run..."

          curl -sS -X POST \
            -H "Content-type: application/json" \
            -H "auth-token: ${TESTRIGOR_TOKEN}" \
            "https://api.testrigor.com/api/v1/apps/${TESTRIGOR_APPID}/retest" >/dev/null

          sleep 10

          for i in $(seq 1 60); do
            resp=$(curl -sS -i -X GET \
              -H "auth-token: ${TESTRIGOR_TOKEN}" \
              -H "Accept: application/json" \
              "https://api.testrigor.com/api/v1/apps/${TESTRIGOR_APPID}/status")

            code=$(echo "$resp" | awk 'NR==1{print $2}')
            echo "DEV testRigor status HTTP: $code"

            if [ "$code" = "200" ]; then
              echo "✅ DEV testRigor PASS"
              exit 0
            elif [ "$code" = "230" ]; then
              echo "❌ DEV testRigor FAIL"
              exit 1
            elif [ "$code" = "227" ] || [ "$code" = "228" ]; then
              echo "⏳ DEV test still running..."
            else
              echo "❌ unexpected status: $code"
              exit 1
            fi

            sleep 10
          done

          echo "❌ DEV testRigor timeout"
          exit 1
        '''
      }
    }

    stage('TestRigor: QA Smoke') {
      when { branch 'staging' }

      environment {
        TESTRIGOR_TOKEN = credentials('testrigor-token')
        TESTRIGOR_APPID = credentials('testrigor-appid-qa')
      }

      steps {
        sh '''
          set -e
          echo "Triggering QA testRigor run..."

          curl -sS -X POST \
            -H "Content-type: application/json" \
            -H "auth-token: ${TESTRIGOR_TOKEN}" \
            "https://api.testrigor.com/api/v1/apps/${TESTRIGOR_APPID}/retest" >/dev/null

          sleep 10

          for i in $(seq 1 60); do
            resp=$(curl -sS -i -X GET \
              -H "auth-token: ${TESTRIGOR_TOKEN}" \
              -H "Accept: application/json" \
              "https://api.testrigor.com/api/v1/apps/${TESTRIGOR_APPID}/status")

            code=$(echo "$resp" | awk 'NR==1{print $2}')
            echo "QA testRigor status HTTP: $code"

            if [ "$code" = "200" ]; then
              echo "✅ QA testRigor PASS"
              exit 0
            elif [ "$code" = "230" ]; then
              echo "❌ QA testRigor FAIL"
              exit 1
            elif [ "$code" = "227" ] || [ "$code" = "228" ]; then
              echo "⏳ QA test still running..."
            else
              echo "❌ unexpected status: $code"
              exit 1
            fi

            sleep 10
          done

          echo "❌ QA testRigor timeout"
          exit 1
        '''
      }
    }
  }

  post {
    success {
      script {
        def targetEnv = (env.BRANCH_NAME == 'main') ? 'DEV' : (env.BRANCH_NAME == 'staging' ? 'QA' : env.BRANCH_NAME)

        sh """
          curl -sS -X POST -H 'Content-type: application/json' \
          --data '{
            "text":"✅ ${APP_NAME} pipeline successful | Env: ${targetEnv} | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}"
          }' \
          "${SLACK_WEBHOOK}"
        """
      }
    }

    failure {
      script {
        def targetEnv = (env.BRANCH_NAME == 'main') ? 'DEV' : (env.BRANCH_NAME == 'staging' ? 'QA' : env.BRANCH_NAME)

        sh """
          curl -sS -X POST -H 'Content-type: application/json' \
          --data '{
            "text":"❌ ${APP_NAME} pipeline failed | Env: ${targetEnv} | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | Check logs: ${BUILD_URL}"
          }' \
          "${SLACK_WEBHOOK}"
        """
      }
    }

    unstable {
      script {
        def targetEnv = (env.BRANCH_NAME == 'main') ? 'DEV' : (env.BRANCH_NAME == 'staging' ? 'QA' : env.BRANCH_NAME)

        sh """
          curl -sS -X POST -H 'Content-type: application/json' \
          --data '{
            "text":"⚠️ ${APP_NAME} pipeline unstable | Env: ${targetEnv} | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}"
          }' \
          "${SLACK_WEBHOOK}"
        """
      }
    }

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