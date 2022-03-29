import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { NOTIFICATIONS_TABLE_NAME} from '../shared/entities'
import { v4 as uuid } from 'uuid';
const AWS = require('aws-sdk');

class MyService {
    sns: any;
    papiClient: PapiClient
    addonUUID: string;

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.AddonUUID
        });

        this.addonUUID = client.AddonUUID;

        AWS.config.region = 'us-west-2';
        this.sns = new AWS.SNS()
    }

    // MARK: AWS endpoints
    // Create PlatformApplication in order to register users mobile endpoints .
    createPlatformApplication(body) {
        const params = {
            Name: body.Name,
            Platform: body.Platform,//or APNS (Apple ) or ADM (Amazon)
            Attributes: {
                PlatformCredential: body.Credential// .p8
            }
        };
        return this.sns.createPlatformApplication(params).promise()
    }

    /*
    It will register mobile to platform application so that 
    if we send notification to platform application it 
    will send notifications to all mobile endpoints registered
    */
    createApplicationEndpoint(body) {
        const params = {
            PlatformApplicationArn: body.ApplicationARN,
            Token: body.DeviceToken
        };
        return this.sns.createPlatformEndpoint(params).promise();
    }

    //creates topics where users can subscribe to the topics
    createTopic(body) {
        const params = {
            Name: body.Name
        }
        return this.sns.createTopic(params).promise()
    }

    // publish to particular topic ARN or to endpoint ARN
    publish(body) {
        const params = {
            Message: body.Message,
            MessageAttributes: {
                someKey: {
                    DataType: body.DataType,
                },
            },
            MessageStructure: 'STRING_VALUE',
            Subject: body.Subject,
            TargetArn: body.TargetArn,
            TopicArn: body.TopicARN
        };
        return this.sns.publish(params).promise();
    }

    subscribeDeviceToTopic(body) {
        const params = {
            Protocol: "application",
            TopicArn: body.TopicARN,
            Endpoint: body.EndpointArn
        };
        return this.sns.subscribe(params).promise();
    }
}

export default MyService;