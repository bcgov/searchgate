pipeline {
    agent none
     environment {
                COMPONENT_NAME = 'SearchGate'
                COMPONENT_HOME = '.'
            }
    options {
        disableResume()
    }
    stages {
        stage('Build') {
            agent { label 'build' }
            steps {

               echo "Aborting all running jobs for $COMPONENT_NAME..."
               script {
                   abortAllPreviousBuildInProgress(currentBuild)
               }
               echo "Building ..."
               sh "cd $COMPONENT_HOME/.pipeline && ./npmw ci && ./npmw run build -- --pr=${CHANGE_ID}"
           }
        }
        stage('Deploy (DEV)') {
            agent { label 'deploy' }
            steps {
                echo "Deploying ..."
                sh "cd $COMPONENT_HOME/.pipeline && ./npmw ci && ./npmw run deploy -- --pr=${CHANGE_ID} --env=dev"
            }
        }
        stage('Deploy (TEST)') {
            agent { label 'deploy' }
            input {
                message "Should we continue with deployment to TEST?"
                ok "Yes!"
            }
            steps {
                echo "Deploying ..."
                sh "cd $COMPONENT_HOME/.pipeline && ./npmw ci && ./npmw run deploy -- --pr=${CHANGE_ID} --env=test"
            }
        }
        stage('Deploy (PROD)') {
            agent { label 'deploy' }
            input {
                message "Should we continue with deployment to PROD?"
                ok "Yes!"
            }
            steps {
                echo "Deploying ..."
                sh "cd $COMPONENT_HOME/.pipeline && ./npmw ci && ./npmw run deploy -- --pr=${CHANGE_ID} --env=prod"
            }
        }
        stage('Cleanup') {
                    agent { label 'deploy' }
                    input {
                        message "Should we clean up build and deployment artifacts related to this PR?"
                        ok "Yes!"
                    }
                    steps {
                        echo "Cleaning ..."
                        sh "cd $COMPONENT_HOME/.pipeline && ./npmw ci && ./npmw run clean -- --pr=${CHANGE_ID} --env=dev"
                    }
                }
    }
}