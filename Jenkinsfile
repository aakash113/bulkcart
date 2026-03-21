pipeline {
  agent any

  tools {
    nodejs 'node-20'
  }

  parameters {
    choice(
      name: 'TARGET_ENV',
      choices: ['DEV', 'QA'],
      description: 'Select environment to deploy'
    )
    booleanParam(
      name: 'RUN_TESTRIGOR',
      defaultValue: false,
      description: 'Run testRigor smoke test after deployment'
    )
  }

  environment {
    DOCKER_CREDS    = credentials('docker-hub-creds')
    DOCKER_USER     = 'aakash113'
    SLACK_WEBHOOK   = credentials('slack-webhook')
    TESTRIGOR_TOKEN = credentials('testrigor-token')
    APP_NAME        = 'BulkCart'
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

    stage('Set Deployment Config') {
      steps {
        script {
          if (params.TARGET_ENV == 'DEV') {
            env.IMAGE_TAG         = 'dev'
            env.DEPLOY_HOST       = '18.222.126.228'
            env.DEPLOY_USER       = 'ec2-user'
            env.DEPLOY_APP_DIR    = '/home/ec2-user/bulkcart/dev'
            env.SSH_CREDENTIAL_ID = 'main-ec2-key'
            env.TESTRIGOR_APPID   = credentials('testrigor-appid-dev')
          } else if (params.TARGET_ENV == 'QA') {
            env.IMAGE_TAG         = 'qa'
            env.DEPLOY_HOST       = '18.222.163.244'
            env.DEPLOY_USER       = 'ec2-user'
            env.DEPLOY_APP_DIR    = '/home/ec2-user/bulkcart/qa'
            env.SSH_CREDENTIAL_ID = 'qa-ec2-key'
            env.TESTRIGOR_APPID   = credentials('testrigor-appid-qa')
          } else {
            error("Unsupported TARGET_ENV: ${params.TARGET_ENV}")
          }

          echo "TARGET_ENV        = ${params.TARGET_ENV}"
          echo "IMAGE_TAG         = ${env.IMAGE_TAG}"
          echo "DEPLOY_HOST       = ${env.DEPLOY_HOST}"
          echo "DEPLOY_USER       = ${env.DEPLOY_USER}"
          echo "DEPLOY_APP_DIR    = ${env.DEPLOY_APP_DIR}"
          echo "SSH_CREDENTIAL_ID = ${env.SSH_CREDENTIAL_ID}"
        }
      }
    }

    stage('Notify Start') {
      steps {
        sh '''
          curl -sS -X POST -H "Content-type: application/json" \
          --data "{
            \\"text\\":\\"🚀 ${APP_NAME} pipeline started | Env: ${TARGET_ENV} | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}\\"
          }" \
          "$SLACK_WEBHOOK"
        '''
      }
    }

    stage('Sanity Check') {
      steps {
        sh 'echo "Branch: $BRANCH_NAME"'
        sh 'echo "Target Env: $TARGET_ENV"'
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
        sh 'echo "$DOCKER_CREDS_PSW" | docker login -u "$DOCKER_CREDS_USR" --password-stdin'
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
            -t aakash113/bulkcart-backend:${IMAGE_TAG} \
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
            -t aakash113/bulkcart-frontend:${IMAGE_TAG} \
            --push \
            ./frontend
        '''
      }
    }

    stage('Deploy') {
      steps {
        sshagent(credentials: ["${env.SSH_CREDENTIAL_ID}"]) {
          sh '''
            set -e
            echo "Deploying ${TARGET_ENV} to ${DEPLOY_HOST}"

            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << EOF
              set -e

              mkdir -p ${DEPLOY_APP_DIR}
              cd ${DEPLOY_APP_DIR}

              echo "Current directory:"
              pwd
              ls -la

              echo "Pulling latest images..."
              docker pull aakash113/bulkcart-backend:${IMAGE_TAG}
              docker pull aakash113/bulkcart-frontend:${IMAGE_TAG}

              echo "Restarting services..."
              docker compose down || true
              docker compose up -d

              echo "Running containers:"
              docker ps

              echo "${TARGET_ENV} deployment complete."
            EOF
          '''
        }
      }
    }

    stage('TestRigor Smoke') {
      when {
        expression { return params.RUN_TESTRIGOR }
      }
      steps {
        sh '''
          set -e

          echo "Triggering testRigor for ${TARGET_ENV}..."
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
              echo "✅ testRigor PASS"
              exit 0
            elif [ "$code" = "230" ]; then
              echo "❌ testRigor FAIL"
              exit 1
            elif [ "$code" = "227" ] || [ "$code" = "228" ]; then
              echo "⏳ test still running..."
            else
              echo "❌ unexpected testRigor status: $code"
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
    success {
      sh '''
        curl -sS -X POST -H "Content-type: application/json" \
        --data "{
          \\"text\\":\\"✅ ${APP_NAME} pipeline successful | Env: ${TARGET_ENV} | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}\\"
        }" \
        "$SLACK_WEBHOOK"
      '''
    }

    failure {
      sh '''
        curl -sS -X POST -H "Content-type: application/json" \
        --data "{
          \\"text\\":\\"❌ ${APP_NAME} pipeline failed | Env: ${TARGET_ENV} | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | Check logs: ${BUILD_URL}\\"
        }" \
        "$SLACK_WEBHOOK"
      '''
    }

    unstable {
      sh '''
        curl -sS -X POST -H "Content-type: application/json" \
        --data "{
          \\"text\\":\\"⚠️ ${APP_NAME} pipeline unstable | Env: ${TARGET_ENV} | Branch: ${BRANCH_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}\\"
        }" \
        "$SLACK_WEBHOOK"
      '''
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