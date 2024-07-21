import {RemovalPolicy, Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {S3Stack} from "./s3";
import {SERVICE_NAME} from "../constant";
import {STAGE} from "../enum/STAGE";
import {CloudFrontToS3} from "@aws-solutions-constructs/aws-cloudfront-s3";

export interface CloudFrontStackProps {
    readonly stage: STAGE
    readonly terminationProtection?: boolean;
}

export class CloudFrontStack extends Stack {
    constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
        super(scope, id, props);

        // TODO: enable
        // TODO: use bucket NOT passed in
        // ref: https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-s3.html#w6aab9c39c15
        // new CloudFrontToS3(this, `${SERVICE_NAME}-cloudfront-s3`, {
        //     existingBucketObj: props.s3.objectBucket,
        //     cloudFrontLoggingBucketProps: {
        //         removalPolicy: RemovalPolicy.DESTROY
        //     }
        // });
    }
}