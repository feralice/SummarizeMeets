import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface SumMeetStackProps extends cdk.StackProps {
  devIp: string;
}

export class SumMeetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SumMeetStackProps) {
    super(scope, id, props);
    // TODO: implement VPC and Security Groups
  }
}
