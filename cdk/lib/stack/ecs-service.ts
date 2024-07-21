import {Duration, Stack} from "aws-cdk-lib";
import {Construct} from "constructs";
import {ApplicationLoadBalancedFargateService} from "aws-cdk-lib/aws-ecs-patterns";
import {AwsLogDriver, Cluster, ContainerImage, DeploymentControllerType} from "aws-cdk-lib/aws-ecs";
import {SERVICE_NAME, SERVICE_STAGE} from "../constant";
import {LogGroup} from "aws-cdk-lib/aws-logs";
import {ApplicationProtocol, Protocol} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {DockerImageAsset} from "aws-cdk-lib/aws-ecr-assets";
import path = require("path");
import {ManagedPolicy, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {VpcStack} from "./vpc";
import {S3Stack} from "./s3";
import {STAGE} from "../enum/STAGE";

export interface EcsServiceStackProps {
    readonly vpc: VpcStack;
    readonly s3: S3Stack;   // might bee

    stage?: STAGE; // dev by default
    enableHttps?: boolean; // false by default
    readonly terminationProtection?: boolean;
}

export class EcsServiceStack extends Stack {
    private readonly props: EcsServiceStackProps;

    constructor(scope: Construct, id: string, props: EcsServiceStackProps) {
        super(scope, id, props);

        // arg check
        if (typeof props.stage === 'undefined') {
            props.stage = SERVICE_STAGE;
        }
        if (typeof props.enableHttps === 'undefined') {
            props.enableHttps = false;
        }
        this.props = props;

        const serviceExecutionRole = this.createServiceExecutionRole();

        // const serviceHostedZone = props.enableHttps ? props.dns!.hostedZone : undefined;
        const INTERNAL_HTTP_PORT = 8080;
        const HTTP_PORT = 80;
        const HTTPS_PORT = 443;
        const cpuUnits = 256;
        const memoryMiB = 512;
        const HEALTH_CHECK_PATH = "/"

        const cluster = new Cluster(this, `${SERVICE_NAME}-Cluster`, {
            clusterName: `${SERVICE_NAME}-Cluster`,
            vpc: props.vpc.vpc,
        });

        const asset = new DockerImageAsset(this, `${SERVICE_NAME}-ServiceImage`, {
            directory: path.join(__dirname, '../../../src'),
        });

        const service = new ApplicationLoadBalancedFargateService(this, `${SERVICE_NAME}-Service`, {
            assignPublicIp: true,
            circuitBreaker: {rollback: true},
            cluster,
            cpu: cpuUnits,
            memoryLimitMiB: memoryMiB,
            deploymentController: {
                type: DeploymentControllerType.ECS,
            },
            desiredCount: 1,
            taskImageOptions: {
                containerName: SERVICE_NAME,
                image: ContainerImage.fromDockerImageAsset(asset),
                environment: {
                    STAGE: props.stage!,
                    PORT: INTERNAL_HTTP_PORT.toString(),
                    HEALTH_CHECK_PATH: HEALTH_CHECK_PATH,
                },
                enableLogging: true,
                logDriver: new AwsLogDriver({
                    streamPrefix: `${SERVICE_NAME}`,
                    logGroup: new LogGroup(this, `${SERVICE_NAME}ApplicationLogGroup`),
                }),
                taskRole: serviceExecutionRole,
                containerPort: INTERNAL_HTTP_PORT,
            },
            loadBalancerName: `${SERVICE_NAME}-${SERVICE_STAGE}-ALB`,
            maxHealthyPercent: 200,
            minHealthyPercent: 100,
            openListener: true,
            publicLoadBalancer: true,
            serviceName: `${props.stage}-${SERVICE_NAME}`,
            targetProtocol: ApplicationProtocol.HTTP, // ALB to server
            protocol: props.enableHttps ? ApplicationProtocol.HTTPS : ApplicationProtocol.HTTP, // client to ALB
            listenerPort: props.enableHttps ? HTTPS_PORT : HTTP_PORT,
            // certificate: props.enableHttps ? props.dns?.acmCertificate : undefined,
            // domainName: props.enableHttps ? serviceHostedZone!.zoneName : undefined,
            // domainZone: props.enableHttps ? serviceHostedZone! : undefined,
        });

        service.loadBalancer.logAccessLogs(props.s3.elbAccessLogBucket);

        service.targetGroup.configureHealthCheck({
            path: HEALTH_CHECK_PATH,
            protocol: Protocol.HTTP,
            healthyHttpCodes: '200',
            interval: Duration.seconds(5),
            timeout: Duration.seconds(2),
            unhealthyThresholdCount: 2,
        });
    }

    private createServiceExecutionRole() {
        const serviceRole = new Role(this, `${SERVICE_NAME}ExecutionRole`, {
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')],
        });

        serviceRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));

        return serviceRole;
    }
}
