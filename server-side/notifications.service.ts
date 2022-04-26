import { PapiClient, InstalledAddon, AddonData } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { NOTIFICATIONS_TABLE_NAME, notificationSchema, messageSchema } from '../shared/entities'
import { Schema, Validator } from 'jsonschema';
import { v4 as uuid } from 'uuid';
import jwt from 'jwt-decode';
const AWS = require('aws-sdk');

class NotificationsService {
    sns: any;
    papiClient: PapiClient
    addonUUID: string;
    accessToken: string;
    currentUserUUID: string;

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });

        this.addonUUID = client.AddonUUID;
        this.accessToken = client.OAuthAccessToken;

        // get user uuid from the token
        const parsedToken: any = jwt(this.accessToken)
        this.currentUserUUID = parsedToken.sub;

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
        //Check that the user did not send a key
        if (body.Key != undefined) {
            throw new Error(`Key is read-only property`);
        }
        // Schema validation
        let validation = this.validateNotifocation(body, notificationSchema);
        if (validation.valid) {
            // Check that the use sent UserUUID in the body
            if (body.UserUUID) {
                // Check that the UserUUID exists in the users list
                try {
                    await this.papiClient.get(`/users/uuid/${body.UserUUID}`)
                    return this.createNotification(body);
                }
                catch {
                    throw new Error(`Could not find a user matching this UserUUID`);
                }
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

    // creates notifications by list of user emails, Subject and Body
    async createNotifications(body) {
        let createdNotifications: AddonData[] = [];
        let faildNotifications: AddonData[] = [];

        let validation = this.validateNotifocation(body, messageSchema);

        if (validation.valid) {
            for (var user of body.EmailsList) {
                //let query = { where: `'Email=${user.Email}'` }
                const users = await this.papiClient.users.find();
                let userUUID = users.find(u => u.Email == user)?.UUID
                if (userUUID) {
                    createdNotifications.push(await this.upsertNotification({
                        "UserUUID": userUUID,
                        "Title": body.Title,
                        "Body": body.Body
                    }));
                }
                else {
                    faildNotifications.push(user);
                    // throw new Error(`User with Email: ${user.Email} does not exist`);
                }
            }
        }
        else {
            return validation.errors.map(error => error.stack.replace("instance.", ""));
        }
        return { 'Successed': createdNotifications, 'Faliure': faildNotifications };
    }

    // create a single notification after all conditions have been checked
    async createNotification(body) {
        body.Key = uuid();
        body.CreatorUUID = this.currentUserUUID;
        return this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).upsert(body);
    }

    async markNotificationsAsRead(body) {
        let readNotifications: AddonData[] = [];
        for (const notification of body.Keys) {
            //Protection against change of properties. The only property that can change is Read
            try {
                let currentNotification = await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).key(notification).get();
                if (this.currentUserUUID === currentNotification.CreatorUUID) {
                    currentNotification.Read = true;
                    let ans = await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).upsert(currentNotification);
                    readNotifications.push(ans);
                }
                else {
                    let error: any = new Error(`The UserUUID is different from the CreatorUUID`);
                    error.code = 403;
                    throw error;
                }
            }
            catch {
                console.log("Notification with key ${notification.Key} does not exist")
            }
        }
        return readNotifications;
    }

    //MARK: API Validation
    validateNotifocation(body: any, schema: any) {
        console.log('schema:', schema);
        const validator = new Validator();
        const result = validator.validate(body, schema);
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