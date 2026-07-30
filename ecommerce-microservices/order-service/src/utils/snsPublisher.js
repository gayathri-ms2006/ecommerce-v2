const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const sns = new SNSClient({
  region: process.env.AWS_REGION || "ap-southeast-1"
});

async function publishOrderCreated(order) {
  const command = new PublishCommand({
    TopicArn: process.env.ORDER_TOPIC_ARN,
    Message: JSON.stringify({
      eventType: "ORDER_CREATED",
      orderId: order.orderId,
      userId: order.userId,
      totalAmount: order.totalAmount
    })
  });

  await sns.send(command);
}

module.exports = {
  publishOrderCreated
};