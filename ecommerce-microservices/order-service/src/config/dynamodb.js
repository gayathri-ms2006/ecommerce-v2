const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const region = process.env.AWS_REGION || "us-east-1";

const config = {
  region,
};

if (process.env.IS_OFFLINE || process.env.MOCK_DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8000";
}

const client = new DynamoDBClient(config);

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

module.exports = docClient;
