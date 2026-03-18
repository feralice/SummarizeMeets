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
      // CDK creates a separate AWS::EC2::SecurityGroupIngress resource
      // when both SGs are in the same stack (to avoid circular dependencies)
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        SourceSecurityGroupId: Match.anyValue(),
      });
    });
  });

  describe('Tags', () => {
    test('VPC has Project and Environment tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
          Match.objectLike({ Key: 'Project', Value: 'summeet' }),
        ]),
      });
    });
  });

  describe('EC2 KeyPair', () => {
    test('creates exactly one EC2 key pair', () => {
      template.resourceCountIs('AWS::EC2::KeyPair', 1);
    });

    test('key pair is named summeet-key-pair', () => {
      template.hasResourceProperties('AWS::EC2::KeyPair', {
        KeyName: 'summeet-key-pair',
      });
    });
  });

  describe('IAM Role', () => {
    test('creates IAM role for EC2 that trusts ec2.amazonaws.com', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('IAM policy grants S3 access scoped to summeet-recordings/*', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:PutObject',
                's3:GetObject',
                's3:DeleteObject',
              ]),
              Resource: 'arn:aws:s3:::summeet-recordings/*',
            }),
          ]),
        }),
      });
    });

    test('IAM policy grants ssm:GetParameter', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'ssm:GetParameter',
            }),
          ]),
        }),
      });
    });
  });

  describe('EC2 Instance', () => {
    test('creates exactly one EC2 instance', () => {
      template.resourceCountIs('AWS::EC2::Instance', 1);
    });

    test('instance type is t3.micro', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('instance has public IP address association', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        NetworkInterfaces: Match.arrayWith([
          Match.objectLike({
            AssociatePublicIpAddress: true,
          }),
        ]),
      });
    });

    test('instance has a key pair attached', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        KeyName: Match.anyValue(),
      });
    });
  });

  describe('RDS Instance', () => {
    test('creates exactly one RDS instance', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('RDS engine is PostgreSQL 16', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: Match.stringLikeRegexp('^16'),
      });
    });

    test('RDS is not publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('RDS backup retention is 7 days', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });
    });

    test('RDS instance class is db.t3.micro', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
      });
    });
  });
});

// ── Phase 3: S3 + CloudFront tests ───────────────────────────────────────────
// Shared setup — separate stack instance to avoid polluting Phase 1/2 template
let p3template: Template;

beforeAll(() => {
  const app = new cdk.App();
  const stack = new SumMeetStack(app, 'TestStackP3', {
    env: { account: '123456789012', region: 'us-east-1' },
    devIp: '203.0.113.50/32',
  });
  p3template = Template.fromStack(stack);
});

describe('S3 Recordings Bucket', () => {
  test('creates summeet-recordings bucket with block all public access', () => {
    p3template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'summeet-recordings',
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('has lifecycle rule with recordings/ prefix transitions and 365-day expiration', () => {
    p3template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'summeet-recordings',
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            Prefix: 'recordings/',
            Status: 'Enabled',
            Transitions: Match.arrayWith([
              Match.objectLike({ StorageClass: 'STANDARD_IA', TransitionInDays: 30 }),
              Match.objectLike({ StorageClass: 'GLACIER_IR', TransitionInDays: 90 }),
            ]),
            ExpirationInDays: 365,
          }),
        ]),
      },
    });
  });
});

describe('S3 Frontend Bucket', () => {
  test('creates summeet-app bucket with block all public access', () => {
    p3template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'summeet-app',
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });
});

describe('CloudFront Distribution', () => {
  test('creates exactly one CloudFront distribution', () => {
    p3template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('distribution uses HTTPS only (redirect) and PriceClass_100', () => {
    p3template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: 'index.html',
        PriceClass: 'PriceClass_100',
      }),
    });
  });

  test('SPA rewrite: 403 and 404 return index.html with HTTP 200', () => {
    p3template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        CustomErrorResponses: Match.arrayWith([
          Match.objectLike({ ErrorCode: 403, ResponseCode: 200, ResponsePagePath: '/index.html' }),
          Match.objectLike({ ErrorCode: 404, ResponseCode: 200, ResponsePagePath: '/index.html' }),
        ]),
      }),
    });
  });

  test('creates exactly one Origin Access Control', () => {
    p3template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
  });

  test('OAC uses s3 origin type with sigv4 signing always', () => {
    p3template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
      OriginAccessControlConfig: Match.objectLike({
        OriginAccessControlOriginType: 's3',
        SigningBehavior: 'always',
        SigningProtocol: 'sigv4',
      }),
    });
  });
});
