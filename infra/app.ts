import * as cdk from 'aws-cdk-lib';
import { SumMeetStack } from './lib/summeet-stack';

const app = new cdk.App();

const stack = new SumMeetStack(app, 'SumMeetStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  devIp: process.env.DEV_IP ?? '0.0.0.0/0',
});

cdk.Tags.of(stack).add('Project', 'summeet');
cdk.Tags.of(stack).add('Environment', 'production');
