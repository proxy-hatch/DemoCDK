import {Duration, RemovalPolicy, Stack} from 'aws-cdk-lib';
import {BlockPublicAccess, Bucket, ObjectOwnership} from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import {SERVICE_NAME} from "../constant";
import {STAGE} from "../enum/STAGE";

export interface S3StackProps {
    readonly stage: STAGE
    readonly terminationProtection?: boolean;
}

export class S3Stack extends Stack {
    public readonly objectBucket: Bucket;
    public readonly elbAccessLogBucket: Bucket;
    private readonly props: S3StackProps;

    constructor(scope: Construct, id: string, props: S3StackProps) {
        super(scope, id, props);
        this.props = props;

        // TODO: create object bucket in cloudfront stack
        this.objectBucket = this.createBucket('object-bucket')

        this.elbAccessLogBucket = this.createBucket('elb-access-log', true);
    }

    private createBucket(name: string, logging = false): Bucket {
        const bucketFullName = this.getBucketName(name);

        return new Bucket(this, bucketFullName, {
            bucketName: bucketFullName,
            removalPolicy: RemovalPolicy.DESTROY,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
            ...(logging && {
                lifecycleRules: [{
                    id: 'limit max log age',
                    expiration: Duration.days(6 * 30),
                }],
            }),
        });
    }

    private getBucketName(name: string): string {
        return `${this.props.stage}-${SERVICE_NAME}-${name}`.toLowerCase();
    }
}