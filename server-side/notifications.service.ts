import { PapiClient, InstalledAddon, AddonData } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { NOTIFICATIONS_TABLE_NAME, notificationSchema} from '../shared/entities'
import { Schema, Validator } from 'jsonschema';
import { v4 as uuid } from 'uuid';
const AWS = require('aws-sdk');

class NotificationsService {
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

        // For page block template
        upsertRelation(relation): Promise<any> {
            return this.papiClient.post('/addons/data/relations', relation);
        }

    async getNotifications(query) {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).find(query.options)
    }

    async upsertNotification(body) {
        let validation = this.validateNotifocation(body);
        if (validation.valid){
            if (body.UserUUID) {
                body.Key = uuid();
                return this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).upsert(body);
            }
            else {
                throw new Error(`UserUUID is required`);
            }
        }
        else {
            const errors = validation.errors.map(error => error.stack.replace("instance.", ""));
            throw new Error(errors.join("\n"));
        }
    }

    // createas notifications by list of user emails, Subject and Body
    async createNotifications(body){
        let createdNotifications: AddonData[] = [];
        let faildNotifications: AddonData[] = [];

        for (var user of body) {
            let validation = this.validateNotifocation(user);
            if (validation.valid){
                //let query = { where: `'Email=${user.Email}'` }
                const users = await this.papiClient.users.find();
                user.UserUUID = users.find(u => u.Email == user.Email)?.UUID
                if (user.UserUUID) {
                    createdNotifications.push(await this.upsertNotification(user));
                }
                else {
                    faildNotifications.push(user);
                   // throw new Error(`User with Email: ${user.Email} does not exist`);
                }
            }
            else {
                faildNotifications.push(user);
            }
        }
        return {'Successed': createdNotifications, 'Faliure': faildNotifications};
    }

    async markNotificationsAsRead(body) {
        let readNotifications: AddonData[] = [];
        for (const notification of body) {
            //Protection against change of properties. The only property that can change is Read
            try {
                let currentNotification = await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).key(notification).get();
                currentNotification.Read = true;
                let ans = await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).upsert(currentNotification);
                readNotifications.push(ans);
            }
            catch {
                console.log("Notification with key ${notification.Key} does not exist")
            }
        }
        return readNotifications;
    }

    //MARK: API Validation
    validateNotifocation(body: any) {
        console.log('notification schema:', notificationSchema);
        const validator = new Validator();
        const result = validator.validate(body, notificationSchema);
        return result;
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

export default NotificationsService;