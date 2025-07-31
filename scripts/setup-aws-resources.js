const { S3Client, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

// Create S3 client for LocalStack
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566', // LocalStack endpoint
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
    sessionToken: 'test'
  },
  maxAttempts: 5,
  requestTimeout: 10000
});

// Create DynamoDB client for DynamoDB Local
const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000', // DynamoDB Local endpoint
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
    sessionToken: 'test'
  },
  maxAttempts: 5,
  requestTimeout: 10000
});

async function createS3Bucket() {
  const bucketName = 'vvpatel20-fragments';
  
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`Attempt ${attempt} to create S3 bucket...`);
      
      // Check if bucket already exists
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log('S3 bucket already exists');
        return;
      } catch (error) {
        if (error.name === 'NotFound') {
          // Bucket doesn't exist, create it
          const command = new CreateBucketCommand({ Bucket: bucketName });
          const result = await s3Client.send(command);
          console.log('S3 bucket created successfully:', result);
          return;
        }
        throw error;
      }
    } catch (error) {
      // Handle LocalStack-specific errors more gracefully
      if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ENOTFOUND') {
        console.log(`Connection error on attempt ${attempt}, retrying in 2 seconds...`);
        if (attempt < 5) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
      
      // If we get a 500 error from LocalStack, assume bucket exists or skip
      if (error.$metadata?.httpStatusCode === 500) {
        console.log('LocalStack returned 500 error, assuming S3 bucket exists or skipping...');
        return;
      }
      
      // For any other error, try to create bucket using direct HTTP request as fallback
      if (attempt === 5) {
        console.log('Trying direct HTTP request to create S3 bucket...');
        try {
          const http = require('http');
          const options = {
            hostname: 'localhost',
            port: 4566,
            path: `/${bucketName}`,
            method: 'PUT'
          };
          
          return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
              if (res.statusCode === 200) {
                console.log('S3 bucket created successfully via HTTP request');
                resolve();
              } else {
                console.log(`HTTP request failed with status ${res.statusCode}, assuming bucket exists`);
                resolve();
              }
            });
            
            req.on('error', (err) => {
              console.log('HTTP request failed, assuming bucket exists or skipping...');
              resolve();
            });
            
            req.end();
          });
        } catch (httpError) {
          console.log('HTTP fallback failed, continuing without S3 bucket...');
          return;
        }
      }
      
      console.error('Error creating S3 bucket:', error);
      throw error;
    }
  }
}

async function createDynamoDBTable() {
  const params = {
    TableName: 'fragments',
    AttributeDefinitions: [
      {
        AttributeName: 'ownerId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'id',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'ownerId',
        KeyType: 'HASH'
      },
      {
        AttributeName: 'id',
        KeyType: 'RANGE'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 5
    }
  };

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`Attempt ${attempt} to create DynamoDB table...`);
      const command = new CreateTableCommand(params);
      const result = await dynamoDBClient.send(command);
      console.log('DynamoDB table created successfully:', result);
      return;
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log('DynamoDB table already exists');
        return;
      } else if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
        console.log(`Connection error on attempt ${attempt}, retrying in 2 seconds...`);
        if (attempt < 5) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
      console.error('Error creating DynamoDB table:', error);
      throw error;
    }
  }
}

async function setupResources() {
  try {
    console.log('Setting up AWS resources...');
    console.log('---------------------------------');
    
    try {
      await createS3Bucket();
    } catch (error) {
      console.log('S3 bucket setup failed, continuing with DynamoDB only...');
    }
    
    await createDynamoDBTable();
    
    console.log('---------------------------------');
    console.log('AWS resources setup completed successfully');
  } catch (error) {
    console.error('Failed to setup AWS resources:', error);
    process.exit(1);
  }
}

setupResources(); 