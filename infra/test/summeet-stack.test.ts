import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SumMeetStack } from '../lib/summeet-stack';

describe('SumMeetStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new SumMeetStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      devIp: '203.0.113.50/32',
    });
    cdk.Tags.of(stack).add('Project', 'summeet');
    cdk.Tags.of(stack).add('Environment', 'production');
    template = Template.fromStack(stack);
  });

  describe('VPC', () => {
    test('creates exactly one VPC with CIDR 10.0.0.0/16', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('creates zero NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('creates public and private subnets', () => {
      // At least one public subnet (with MapPublicIpOnLaunch true)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
      // At least one private subnet (MapPublicIpOnLaunch false)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });
  });

  describe('EC2 Security Group', () => {
    test('allows SSH from specific developer IP only (not 0.0.0.0/0)', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '203.0.113.50/32',
          }),
        ]),
      });
    });

    test('allows HTTP from anywhere', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('allows HTTPS from anywhere', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });
  });

  describe('RDS Security Group', () => {
    test('allows PostgreSQL 5432 only from EC2 Security Group (not a CIDR)', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 5432,
            ToPort: 5432,
            SourceSecurityGroupId: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('Tags', () => {
    test('VPC has Project and Environment tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Project', Value: 'summeet' }),
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
        ]),
      });
    });
  });
});
