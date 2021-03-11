def buildNumber = env.BUILD_NUMBER as int
if (buildNumber > 1) milestone(buildNumber - 1)
milestone(buildNumber)

pipeline {
    agent any

    environment {
        SLACK_CHANNEL = '#ci'
    }

    stages {
        stage('Install') {
            steps {
                sh 'yarn install'
            }
        }

        stage('Lint') {
            steps {
                sh 'yarn lint'
                sh 'yarn prettier'
            }
            post {
                failure {
                    script {
                        if (env.BRANCH_NAME == 'master') {
                            slackSend(
                                channel: env.SLACK_CHANNEL,
                                message: "${env.JOB_NAME.split('/')[1]} (${env.BRANCH_NAME}) ${env.STAGE_NAME.toLowerCase()} failed. (<${env.RUN_DISPLAY_URL}|View in Jenkins>)",
                                color: 'warning'
                            )
                        }
                    }
                }
            }
        }

        stage('Build') {
            steps {
                sh 'yarn build'
            }
            post {
                failure {
                    script {
                        if (env.BRANCH_NAME == 'master') {
                            slackSend(
                                channel: env.SLACK_CHANNEL,
                                message: "${env.JOB_NAME.split('/')[1]} (${env.BRANCH_NAME}) ${env.STAGE_NAME.toLowerCase()} failed. (<${env.RUN_DISPLAY_URL}|View in Jenkins>)",
                                color: 'warning'
                            )
                        }
                    }
                }
            }
        }
    }
}
