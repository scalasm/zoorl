#!/usr/bin/env bash
set -e

# These will be set by the pipeline environment
#export TARGET_AWS_REGION="eu-west-1"
#export USER_POOL_ID="eu-west-1_Ys9WtvIC5"
#export USER_POOL_CLIENT_ID="3upuas0bm1mbddq4oksf4o01nv"
NEW_USER="test@something.com"
NEW_USER_PASSWORD="Change3me.2"

# Only used in before confirming the user
NEW_USER_TEMP_PASSWORD="Change3me."

aws cognito-idp admin-create-user --region $TARGET_AWS_REGION --user-pool-id "$USER_POOL_ID" --username "$NEW_USER" --temporary-password "$NEW_USER_TEMP_PASSWORD"

aws cognito-idp admin-set-user-password --region $TARGET_AWS_REGION --user-pool-id "$USER_POOL_ID" --username "$NEW_USER" --password "$NEW_USER_PASSWORD" --permanent

ID_TOKEN=$(aws cognito-idp admin-initiate-auth --region $TARGET_AWS_REGION --user-pool-id "$USER_POOL_ID" \
 --client-id "$USER_POOL_CLIENT_ID" --auth-flow ADMIN_NO_SRP_AUTH \
 --output text \
 --auth-parameters USERNAME="$NEW_USER",PASSWORD=$NEW_USER_PASSWORD --query AuthenticationResult.IdToken)

echo $ID_TOKEN > /tmp/id_token.txt
