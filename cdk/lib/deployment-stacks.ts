import {Environment, StackProps, Stage} from "aws-cdk-lib";
import {VpcStack} from "./stack/vpc";
import {S3Stack} from "./stack/s3";
import {EcsServiceStack} from "./stack/ecs-service";
import {Construct} from "constructs";
import {SERVICE_NAME} from "./constant";
import {STAGE} from "./enum/STAGE";
import {CloudFrontStack} from "./stack/cloudfront";

export interface DeploymentStacksProps extends StackProps {
    readonly env: Environment;
    readonly stage: STAGE;
}

export class DeploymentStacks extends Stage {
    public readonly vpc: VpcStack;
    public readonly s3: S3Stack;
    public readonly cloudfront: CloudFrontStack;
    public readonly ecs: EcsServiceStack;

    constructor(scope: Construct, id: string, props: DeploymentStacksProps) {
        super(scope, id, props);

        const {stage} = props

        const terminationProtection = stage !== STAGE.DEV; // Termination protection for non-DEV envs
        const enableHttps = stage !== STAGE.DEV;

        this.vpc = new VpcStack(this, `${SERVICE_NAME}-Vpc`, {
            terminationProtection,
        });

        this.s3 = new S3Stack(this, `${SERVICE_NAME}-S3`, {
            stage,
            terminationProtection,
        });

        this.cloudfront = new CloudFrontStack(this, `${SERVICE_NAME}-CloudFront`, {
            stage,
            terminationProtection,
        });

        // if (enableHttps) {
        //     this.dns = new DnsStack(this, `${stackPrefix}-Dns`, {
        //         stackCreationInfo,
        //         terminationProtection,
        //     });
        // }

        this.ecs = new EcsServiceStack(this, `${SERVICE_NAME}-EcsService`, {
            vpc: this.vpc,
            // dns: enableHttps ? this.dns : undefined,
            s3: this.s3,
            enableHttps,
            terminationProtection,
        });
    }
}