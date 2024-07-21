#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {DeploymentStacks} from "../lib/deployment-stacks";
import {SERVICE_NAME} from "../lib/constant";
import {STAGE} from "../lib/enum/STAGE";

const app = new cdk.App();
new DeploymentStacks(app, `${SERVICE_NAME}-DeploymentStacks`, {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
    stage: STAGE.DEV
})
