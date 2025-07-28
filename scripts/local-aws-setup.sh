#!/bin/bash

# Set AWS environment variables for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_SESSION_TOKEN=test
export AWS_DEFAULT_REGION=us-east-1

echo "Setting up LocalStack resources..."
echo "---------------------------------"

# Wait for S3 to be ready
echo -n "Waiting for S3 service to be ready..."
until (curl --silent http://localhost:4566/_localstack/health | grep "\"s3\": \"\(running\|available\)\"" > /dev/null); do
    sleep 2
    echo -n "."
done
echo -e "\nS3 service is ready"

# Create S3 bucket (using your personal bucket name)
echo "Creating S3 bucket: vvpatel20-fragments"
if aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket vvpatel20-fragments; then
    echo "Successfully created S3 bucket"
else
    echo "ERROR: Failed to create S3 bucket" >&2
    exit 1
fi

# Create DynamoDB table
echo "Creating DynamoDB table: fragments"
if aws --endpoint-url=http://localhost:8000 dynamodb create-table \
    --table-name fragments \
    --attribute-definitions \
        AttributeName=ownerId,AttributeType=S \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=ownerId,KeyType=HASH \
        AttributeName=id,KeyType=RANGE \
    --provisioned-throughput \
        ReadCapacityUnits=10,WriteCapacityUnits=5; then
    echo "Successfully created DynamoDB table"
else
    echo "ERROR: Failed to create DynamoDB table" >&2
    exit 1
fi

# Wait for table to be active
echo -n "Waiting for DynamoDB table to be ready..."
if aws --endpoint-url=http://localhost:8000 dynamodb wait table-exists --table-name fragments; then
    echo -e "\nDynamoDB table is ready"
else
    echo -e "\nERROR: Timed out waiting for DynamoDB table" >&2
    exit 1
fi

echo "---------------------------------"
echo "LocalStack setup completed successfully"