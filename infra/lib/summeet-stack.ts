import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SumMeetStackProps extends cdk.StackProps {
  devIp: string; // e.g., '203.0.113.1/32' -- developer's public IP for SSH
}

export class SumMeetStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly sgEc2: ec2.SecurityGroup;
  public readonly sgRds: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SumMeetStackProps) {
    super(scope, id, props);

    // VPC: 10.0.0.0/16, 1 AZ, no NAT Gateway
    // Public subnet for EC2, Private Isolated for RDS
    // CRITICAL: Use PRIVATE_ISOLATED (not PRIVATE_WITH_EGRESS) because natGateways: 0
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: 'summeet-vpc',
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'summeet-public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'summeet-private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // EC2 Security Group: SSH (dev IP only), HTTP, HTTPS -- outbound all
    this.sgEc2 = new ec2.SecurityGroup(this, 'SgEc2', {
      vpc: this.vpc,
      securityGroupName: 'summeet-sg-ec2',
      description: 'SumMeet EC2: SSH (dev only), HTTP, HTTPS',
      allowAllOutbound: true,
    });
    this.sgEc2.addIngressRule(
      ec2.Peer.ipv4(props.devIp),
      ec2.Port.tcp(22),
      'SSH from developer IP'
    );
    this.sgEc2.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP'
    );
    this.sgEc2.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS'
    );

    // RDS Security Group: PostgreSQL 5432 from EC2 SG only -- no outbound
    this.sgRds = new ec2.SecurityGroup(this, 'SgRds', {
      vpc: this.vpc,
      securityGroupName: 'summeet-sg-rds',
      description: 'SumMeet RDS: PostgreSQL from EC2 SG only',
      allowAllOutbound: false,
    });
    this.sgRds.addIngressRule(
      this.sgEc2,
      ec2.Port.tcp(5432),
      'PostgreSQL from EC2 SG'
    );
  }
}
