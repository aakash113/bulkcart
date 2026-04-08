pipeline {
  agent any

  tools {
    nodejs 'node-20'
  }

  parameters {
    choice(
      name: 'DEPLOY_ENV',
      choices: ['QA', 'PROD'],
      description: 'Select environment to deploy'
    )
    booleanParam(
      name: 'RUN_QA_SMOKE',
      defaultValue: true,
      description: 'Run testRigor smoke test after QA deployment'
    )
    string(
      name: 'TESTRIGOR_TEST_CASE_UUIDS',
      defaultValue: '5044b1e9-9509-40f7-a1a3-1158a8cbb8f9',
      description: 'Comma-separated testRigor test case UUIDs to run for QA smoke. Leave blank to run the full suite.'
    )
  }

  environment {
    DOCKER_CREDS    = credentials('docker-hub-creds')
    DOCKER_USER     = 'aakash113'
    SLACK_WEBHOOK   = credentials('slack-webhook')
    APP_NAME        = 'BulkCart'
    NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
    NODE_OPTIONS    = '--max-old-space-size=4096'
  }

  stages {
    stage('Set Environment Config') {
      steps {
        script {
          if (params.DEPLOY_ENV == 'QA') {
            env.ENV_NAME          = 'QA'
            env.IMAGE_TAG         = 'qa'
            env.DEPLOY_HOST       = '18.222.163.244'
            env.DEPLOY_USER       = 'ec2-user'
            env.DEPLOY_APP_DIR    = '/home/ec2-user/bulkcart/qa'
            env.SSH_CREDENTIAL_ID = 'bulkcart-key-pem'
          } else if (params.DEPLOY_ENV == 'PROD') {
            env.ENV_NAME          = 'PROD'
            env.IMAGE_TAG         = 'prod'
            env.DEPLOY_HOST       = '18.222.126.228'
            env.DEPLOY_USER       = 'ec2-user'
            env.DEPLOY_APP_DIR    = '/home/ec2-user/bulkcart/prod'
            env.SSH_CREDENTIAL_ID = 'bulkcart-key-pem'
          } else {
            error("Unsupported DEPLOY_ENV: ${params.DEPLOY_ENV}")
          }

          echo "ENV_NAME          = ${env.ENV_NAME}"
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
          curl -sS -X POST -H 'Content-type: application/json' \
          --data "{
            \\"text\\":\\"🚀 ${APP_NAME} pipeline started | Env: ${ENV_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}\\"
          }" \
          "$SLACK_WEBHOOK"
        '''
      }
    }

    stage('Sanity Check') {
      steps {
        sh 'echo "Deploy env: $DEPLOY_ENV"'
        sh 'node -v'
        sh 'which node'
        sh 'npm -v || true'
        sh 'docker -v'
        sh 'echo "Jenkins public IP:" && (curl -s https://checkip.amazonaws.com || curl -s ifconfig.me || true) && echo'
        sh 'pwd'
        sh 'mkdir -p "$NPM_CONFIG_CACHE"'
        sh 'ls -la'
        sh 'ls -la backend frontend'
      }
    }

    stage('CI: Install & Build') {
      parallel {
        stage('Backend Build') {
          steps {
            dir('backend') {
              sh 'npm install --no-audit --no-fund'
              sh 'npm run build'
            }
          }
        }

        stage('Frontend Build') {
          steps {
            dir('frontend') {
              sh 'npm install --legacy-peer-deps --no-audit --no-fund'
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
          sh "docker build -t ${DOCKER_USER}/bulkcart-backend:${IMAGE_TAG} backend"
          sh "docker push ${DOCKER_USER}/bulkcart-backend:${IMAGE_TAG}"
          sh "docker build -t ${DOCKER_USER}/bulkcart-frontend:${IMAGE_TAG} frontend"
          sh "docker push ${DOCKER_USER}/bulkcart-frontend:${IMAGE_TAG}"
        }
      }
    }

    stage('Approve PROD') {
      when {
        expression { return params.DEPLOY_ENV == 'PROD' }
      }
      steps {
        input message: 'Approve PROD deployment?', ok: 'Deploy PROD'
      }
    }

    stage('Deploy') {
      steps {
        withCredentials([file(credentialsId: "${env.SSH_CREDENTIAL_ID}", variable: 'SSH_KEY_FILE')]) {
          sh(script: '''
            set -e
            echo "Deploying to ${ENV_NAME} EC2: $DEPLOY_HOST"
            chmod 600 "$SSH_KEY_FILE"

            ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} \
              "mkdir -p ${DEPLOY_APP_DIR}"

            scp -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no docker-compose.deploy.yml \
              ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_APP_DIR}/docker-compose.yml

            ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} \
              "DEPLOY_APP_DIR=${DEPLOY_APP_DIR} IMAGE_TAG=${IMAGE_TAG} ENV_NAME=$(echo ${ENV_NAME} | tr '[:upper:]' '[:lower:]') bash -s" <<'EOF'
            set -e
            mkdir -p "$DEPLOY_APP_DIR"
            cd "$DEPLOY_APP_DIR"

            docker pull "aakash113/bulkcart-backend:${IMAGE_TAG}"
            docker pull "aakash113/bulkcart-frontend:${IMAGE_TAG}"

            docker compose down || true
            docker rm -f bulkcart-frontend-qa bulkcart-backend-qa bulkcart-mongo-qa 2>/dev/null || true
            docker network rm ec2-user_default qa_default 2>/dev/null || true
            IMAGE_TAG="$IMAGE_TAG" ENV_NAME="$ENV_NAME" docker compose up -d

            for i in $(seq 1 12); do
              if curl -fsS http://localhost:3000/api/health >/dev/null; then
                echo "Backend health check passed"
                break
              fi
              if [ "$i" -eq 12 ]; then
                echo "Backend health check failed"
                docker ps
                docker compose logs --tail=50 backend
                exit 1
              fi
              sleep 5
            done

            for i in $(seq 1 18); do
              if curl -fsS http://localhost:4200 >/dev/null; then
                echo "Frontend health check passed"
                break
              fi
              if [ "$i" -eq 18 ]; then
                echo "Frontend health check failed"
                docker ps
                docker compose logs --tail=50 frontend
                exit 1
              fi
              sleep 5
            done

            docker ps
            echo "Deployment complete."
EOF
          '''.stripIndent())
        }
      }
    }

    stage('TestRigor: QA Smoke') {
      when {
        expression { return params.DEPLOY_ENV == 'QA' && params.RUN_QA_SMOKE }
      }

      steps {
        script {
          def selectedTestCaseUuids = params.TESTRIGOR_TEST_CASE_UUIDS
            .split(',')
            .collect { it.trim() }
            .findAll { it }
          def retestPayload = selectedTestCaseUuids
            ? groovy.json.JsonOutput.toJson([testCaseUuids: selectedTestCaseUuids])
            : '{}'

          withCredentials([
            string(credentialsId: 'testrigor-token', variable: 'TESTRIGOR_TOKEN'),
            string(credentialsId: 'testrigor-appid-qa', variable: 'TESTRIGOR_APPID')
          ]) {
            sh """
              set -e

              echo "Triggering testRigor run..."
              curl -sS -X POST \
                -H "Content-type: application/json" \
                -H "auth-token: \${TESTRIGOR_TOKEN}" \
                --data '${retestPayload}' \
                "https://api.testrigor.com/api/v1/apps/\${TESTRIGOR_APPID}/retest" >/dev/null

              echo "Polling testRigor status..."
              sleep 10

              for i in \$(seq 1 120); do
                resp=\$(curl -sS -i -X GET \
                  -H "auth-token: \${TESTRIGOR_TOKEN}" \
                  -H "Accept: application/json" \
                  "https://api.testrigor.com/api/v1/apps/\${TESTRIGOR_APPID}/status")

                code=\$(echo "\$resp" | awk 'NR==1{print \$2}')
                echo "testRigor status HTTP: \$code"
                echo "\$resp" | grep -m1 '"detailsUrl"' || true
                echo "\$resp" | grep -m1 '"overallResults"' || true

                if [ "\$code" = "200" ]; then
                  echo "QA smoke PASS"
                  exit 0
                elif [ "\$code" = "230" ]; then
                  echo "QA smoke FAIL"
                  exit 1
                elif [ "\$code" = "227" ] || [ "\$code" = "228" ]; then
                  echo "still running..."
                elif [ "\$code" = "500" ] || [ "\$code" = "502" ] || [ "\$code" = "503" ] || [ "\$code" = "504" ]; then
                  echo "testRigor API temporary error, retrying..."
                else
                  echo "unexpected status: \$code"
                  exit 1
                fi

                sleep 10
              done

              echo "QA smoke timeout after 20 minutes"
              exit 1
            """
          }
        }
      }
    }
  }

  post {
    success {
      sh '''
        curl -sS -X POST -H 'Content-type: application/json' \
        --data "{
          \\"text\\":\\"✅ ${APP_NAME} pipeline successful | Env: ${ENV_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}\\"
        }" \
        "$SLACK_WEBHOOK"
      '''
    }

    failure {
      sh '''
        curl -sS -X POST -H 'Content-type: application/json' \
        --data "{
          \\"text\\":\\"❌ ${APP_NAME} pipeline failed | Env: ${ENV_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | Check logs: ${BUILD_URL}\\"
        }" \
        "$SLACK_WEBHOOK"
      '''
    }

    unstable {
      sh '''
        curl -sS -X POST -H 'Content-type: application/json' \
        --data "{
          \\"text\\":\\"⚠️ ${APP_NAME} pipeline unstable | Env: ${ENV_NAME} | Job: ${JOB_NAME} | Build: #${BUILD_NUMBER} | ${BUILD_URL}\\"
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
