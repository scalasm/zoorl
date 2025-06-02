#!/usr/bin/env bash
set -e

# These will be set by the pipeline environment
#export TARGET_AWS_REGION="eu-west-1"
#export USER_POOL_ID="eu-west-1_Ys9WtvIC5"
#export USER_POOL_CLIENT_ID="3upuas0bm1mbddq4oksf4o01nv"
NEW_USER="test@something.com"

aws cognito-idp admin-delete-user --region $TARGET_AWS_REGION --user-pool-id "$USER_POOL_ID" --username "$NEW_USER"
