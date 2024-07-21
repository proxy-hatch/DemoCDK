import {Stack} from 'aws-cdk-lib';
import {GatewayVpcEndpointAwsService, SubnetType, Vpc} from 'aws-cdk-lib/aws-ec2';
import {AnyPrincipal, PolicyStatement} from 'aws-cdk-lib/aws-iam';
import {Construct} from 'constructs';
import {SERVICE_NAME} from "../constant";

export interface VpcStackProps {
    readonly terminationProtection?: boolean;
}

export class VpcStack extends Stack {
    public readonly vpc: Vpc;

    constructor(scope: Construct, id: string, props: VpcStackProps) {
        super(scope, id, props);

        this.vpc = new Vpc(this, `${SERVICE_NAME}-Vpc`, {
            natGateways: 0,
            maxAzs: Stack.of(this).availabilityZones.length,
            subnetConfiguration: [
                {
                    cidrMask: 20,
                    subnetType: SubnetType.PUBLIC,
                    name: 'Public',
                },
                {
                    cidrMask: 20,
                    subnetType: SubnetType.PRIVATE_ISOLATED,
                    name: 'Isolated',
                },
            ],
            // TODO: add flow log https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.FlowLogOptions.html
            // flowLogRetentionDays: RetentionDays.TEN_YEARS,
        });

        const bucketGatewayEndpoint = this.vpc.addGatewayEndpoint('bucketGatewayEndpoint', {
            service: GatewayVpcEndpointAwsService.S3,
        });

        bucketGatewayEndpoint.addToPolicy(new PolicyStatement({
            principals: [new AnyPrincipal()],
            actions: ['s3:*'],
            resources: ['*'],
        }));
    }
}