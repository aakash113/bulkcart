pipeline {
  agent any

  tools {
    nodejs 'node-20'
  }

  options {
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    timestamps()
  }

  parameters {
    choice(
      name: 'DEPLOY_ENV',
      choices: ['QA', 'PROD'],
      description: 'Choose the environment to deploy'
    )
    booleanParam(
      name: 'RUN_QA_SMOKE',
      defaultValue: true,
      description: 'Run QA smoke tests after QA deployment'
    )
  }

  environment {
    APP_NAME    = 'BulkCart'
    DOCKER_USER = 'aakash113'
    DEPLOY_USER = 'ec2-user'
  }

  stages {
    stage('Validate Branch') {
      steps {
        script {
          if (env.BRANCH_NAME != 'main') {
            error("This pipeline only deploys from main branch. Current branch: ${env.BRANCH_NAME}")
          }
        }
      }
    }

    stage('Set Environment Config') {
      steps {
        script {
          if (params.DEPLOY_ENV == 'QA') {
            env.IMAGE_TAG                  = 'qa'
            env.DEPLOY_HOST                = '18.222.163.244'
            env.DEPLOY_APP_DIR             = '/home/ec2-user/bulkcart/qa'
            env.SSH_CREDENTIAL_ID          = 'qa-ec2-key'
            env.SLACK_WEBHOOK_CREDENTIAL   = 'slack-webhook-qa'
            env.TESTRIGOR_APPID_CREDENTIAL = 'testrigor-appid-qa'
            env.ENV_LABEL                  = 'QA'
          } else if (params.DEPLOY_ENV == 'PROD') {
            env.IMAGE_TAG                  = 'prod'
            env.DEPLOY_HOST                = '18.222.126.228'
            env.DEPLOY_APP_DIR             = '/home/ec2-user/bulkcart/prod'
            env.SSH_CREDENTIAL_ID          = 'main-ec2-key'
            env.SLACK_WEBHOOK_CREDENTIAL   = 'slack-webhook-prod'
            env.TESTRIGOR_APPID_CREDENTIAL = ''
            env.ENV_LABEL                  = 'PROD'
          } else {
            error("Unsupported DEPLOY_ENV: ${params.DEPLOY_ENV}")
          }

          echo "DEPLOY_ENV               = ${params.DEPLOY_ENV}"
          echo "IMAGE_TAG                = ${env.IMAGE_TAG}"
          echo "DEPLOY_HOST              = ${env.DEPLOY_HOST}"
          echo "DEPLOY_APP_DIR           = ${env.DEPLOY_APP_DIR}"
          echo "SSH_CREDENTIAL_ID        = ${env.SSH_CREDENTIAL_ID}"
          echo "SLACK_WEBHOOK_CREDENTIAL = ${env.SLACK_WEBHOOK_CREDENTIAL}"
        }
      }
    }

    stage('Slack Notify Start') {
      steps {
        withCredentials([string(credentialsId: "${env.SLACK_WEBHOOK_CREDENTIAL}", variable: 'SLACK_WEBHOOK_URL')]) {
          sh '''
            curl -sS -X POST -H "Content-type: application/json" \
            --data "{
              \\"text\\":\\"🚀 ${APP_NAME} ${ENV_LABEL} deployment started | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}\\"
            }" \
            "$SLACK_WEBHOOK_URL"
          '''
        }
      }
    }

    stage('Sanity Check') {
      steps {
        sh 'echo "Branch: $BRANCH_NAME"'
        sh 'echo "Deploy Env: $DEPLOY_ENV"'
        sh 'node -v'
        sh 'npm -v || true'
        sh 'docker -v'
        sh 'docker buildx version || true'
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

    stage('CD: Docker Login') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
          sh 'echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin'
        }
      }
    }

    stage('CD: Setup Buildx') {
      steps {
        sh '''
          set +e
          docker buildx inspect bulkcartbuilder >/dev/null 2>&1
          if [ $? -ne 0 ]; then
            docker buildx create --name bulkcartbuilder --use
          else
            docker buildx use bulkcartbuilder
          fi
          set -e

          docker buildx inspect --bootstrap
        '''
      }
    }

    stage('CD: Build & Push Backend Image') {
      steps {
        sh '''
          docker buildx build \
            --platform linux/amd64 \
            -t ${DOCKER_USER}/bulkcart-backend:${IMAGE_TAG} \
            --push \
            ./backend
        '''
      }
    }

    stage('CD: Build & Push Frontend Image') {
      steps {
        sh '''
          docker buildx build \
            --platform linux/amd64 \
            -t ${DOCKER_USER}/bulkcart-frontend:${IMAGE_TAG} \
            --push \
            ./frontend
        '''
      }
    }

    stage('Approve PROD') {
      when {
        expression { params.DEPLOY_ENV == 'PROD' }
      }
      steps {
        input message: 'Approve BulkCart PROD deployment?', ok: 'Deploy PROD'
      }
    }

    stage('Deploy') {
      steps {
        sshagent(credentials: ["${env.SSH_CREDENTIAL_ID}"]) {
          sh '''
            set -e
            echo "Deploying ${DEPLOY_ENV} to ${DEPLOY_HOST}"

            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << EOF
              set -e

              mkdir -p ${DEPLOY_APP_DIR}
              cd ${DEPLOY_APP_DIR}

              echo "Current directory:"
              pwd
              ls -la

              echo "Pulling latest images..."
              docker pull ${DOCKER_USER}/bulkcart-backend:${IMAGE_TAG}
              docker pull ${DOCKER_USER}/bulkcart-frontend:${IMAGE_TAG}

              echo "Restarting services..."
              docker compose down || true
              IMAGE_TAG=${IMAGE_TAG} docker compose up -d

              echo "Waiting for services..."
              sleep 15

              echo "Health checks..."
              curl -fsS http://localhost:3000/api/health
              curl -fsS http://localhost:4200 >/dev/null

              echo "Running containers:"
              docker ps

              echo "${DEPLOY_ENV} deployment complete."
            EOF
          '''
        }
      }
    }

    stage('QA Smoke Test') {
      when {
        allOf {
          expression { params.DEPLOY_ENV == 'QA' }
          expression { params.RUN_QA_SMOKE }
        }
      }
      steps {
        withCredentials([
          string(credentialsId: 'testrigor-token', variable: 'TESTRIGOR_TOKEN'),
          string(credentialsId: "${env.TESTRIGOR_APPID_CREDENTIAL}", variable: 'TESTRIGOR_APPID')
        ]) {
          sh '''
            set -e

            echo "Triggering testRigor for QA..."
            curl -sS -X POST \
              -H "Content-type: application/json" \
              -H "auth-token: ${TESTRIGOR_TOKEN}" \
              "https://api.testrigor.com/api/v1/apps/${TESTRIGOR_APPID}/retest" >/dev/null

            echo "Waiting before polling..."
            sleep 10

            for i in $(seq 1 60); do
              resp=$(curl -sS -i -X GET \
                -H "auth-token: ${TESTRIGOR_TOKEN}" \
                -H "Accept: application/json" \
                "https://api.testrigor.com/api/v1/apps/${TESTRIGOR_APPID}/status")

              code=$(echo "$resp" | awk 'NR==1{print $2}')
              echo "testRigor status HTTP: $code"

              if [ "$code" = "200" ]; then
                echo "QA smoke PASS"
                exit 0
              elif [ "$code" = "230" ]; then
                echo "QA smoke FAIL"
                exit 1
              elif [ "$code" = "227" ] || [ "$code" = "228" ]; then
                echo "QA smoke still running..."
              else
                echo "Unexpected testRigor status: $code"
                exit 1
              fi

              sleep 10
            done

            echo "QA smoke timeout"
            exit 1
          '''
        }
      }
    }
  }

  post {
    success {
      script {
        withCredentials([string(credentialsId: "${env.SLACK_WEBHOOK_CREDENTIAL}", variable: 'SLACK_WEBHOOK_URL')]) {
          sh '''
            curl -sS -X POST -H "Content-type: application/json" \
            --data "{
              \\"text\\":\\"✅ ${APP_NAME} ${ENV_LABEL} deployment successful | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}\\"
            }" \
            "$SLACK_WEBHOOK_URL"
          '''
        }
      }
    }

    failure {
      script {
        withCredentials([string(credentialsId: "${env.SLACK_WEBHOOK_CREDENTIAL}", variable: 'SLACK_WEBHOOK_URL')]) {
          sh '''
            curl -sS -X POST -H "Content-type: application/json" \
            --data "{
              \\"text\\":\\"❌ ${APP_NAME} ${ENV_LABEL} deployment failed | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | Check logs: ${BUILD_URL}\\"
            }" \
            "$SLACK_WEBHOOK_URL"
          '''
        }
      }
    }

    unstable {
      script {
        withCredentials([string(credentialsId: "${env.SLACK_WEBHOOK_CREDENTIAL}", variable: 'SLACK_WEBHOOK_URL')]) {
          sh '''
            curl -sS -X POST -H "Content-type: application/json" \
            --data "{
              \\"text\\":\\"⚠️ ${APP_NAME} ${ENV_LABEL} deployment unstable | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}\\"
            }" \
            "$SLACK_WEBHOOK_URL"
          '''
        }
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
