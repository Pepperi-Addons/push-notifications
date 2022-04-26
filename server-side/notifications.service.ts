import { PapiClient, InstalledAddon, AddonData } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { NOTIFICATIONS_TABLE_NAME, USER_DEVICE_TABLE_NAME, notificationSchema, messageSchema, userDeviceSchema, UserDevice } from '../shared/entities'
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

    // subscribe to remove event in order to remove the user device endpoint from aws when the expiration date arrives 
    createPNSSubscription() {
        return this.papiClient.notification.subscriptions.upsert({
            AddonUUID: this.addonUUID,
            AddonRelativeURL: "/api/user_device_removed",
            Type: "data",
            Name: "deviceRemovalSubscription",
            FilterPolicy: {
                Action: ['remove'],
                Resource: [USER_DEVICE_TABLE_NAME],
                AddonUUID: [this.addonUUID]
            }
        });
    }

    // For page block template
    upsertRelation(relation): Promise<any> {
        return this.papiClient.post('/addons/data/relations', relation);
    }

    async getNotifications(query) {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).find(query)
    }

    async upsertNotification(body) {
        //Check that the user did not send a key
        if (body.Key != undefined) {
            throw new Error(`Key is read-only property`);
        }
        // Schema validation
        let validation = this.validateSchema(body, notificationSchema);
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

        let validation = this.validateSchema(body, messageSchema);

        if (validation.valid) {
            for (var user of body.EmailsList) {
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
        return { 'Success': createdNotifications, 'Failure': faildNotifications };
    }

    // create a single notification after all conditions have been checked
    async createNotification(body) {
        body.Key = uuid();
        body.CreatorUUID = this.currentUserUUID;
        this.sendPushNotification(body);
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

    //MARK: UserDevice handling
    async registerUserDevice(body) {
        // Schema validation
        let validation = this.validateSchema(body, userDeviceSchema);
        if (validation.valid) {
            const appARN: string = await this.getPlatformApplicationARN(body.AppID);
            let endpointARN = await this.createApplicationEndpoint({
                PlatformApplicationArn: appARN,
                DeviceToken: body.Token
            });

            if (endpointARN.EndpointArn != undefined) {
                return await this.upsertUserDeviceResource(body, endpointARN);
            }
            else {
                throw new Error("Register user device faild");
            }
        }
        else {
            const errors = validation.errors.map(error => error.stack.replace("instance.", ""));
            throw new Error(errors.join("\n"));
        }
    }

    async upsertUserDeviceResource(body, endpointARN) {
        let userDevice: UserDevice;
        // if the user has registered devices, only add the new device to the list and create endpoint for the new device
        try {
            userDevice = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).key(body.UserID).get() as any;
            userDevice.EndpointsARN.push(endpointARN);
        }
        catch {
            let expirationDateTime = new Date();
            expirationDateTime.setDate(expirationDateTime.getDate() + 30);

            userDevice = {
                "Key": body.UserID,
                "UserID": body.UserID,
                "AppID": body.AppID,
                "DeviceID": body.DeviceID,
                "DeviceName": body.DeviceName,
                "DeviceType": body.DeviceType,
                "Token": body.Token,
                "EndpointsARN": [],
                "ExpirationDateTime": expirationDateTime
            };
            userDevice.EndpointsARN.push(endpointARN);
        }
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).upsert(userDevice);
    }

    async removeUserDeviceEndpoint(body) {
        for (const object of body.Message.ModifiedObjects) {
            await this.sns.DeleteEndpoint(object.EndpointARN);
        }
    }

    async sendPushNotification(notification) {
        //get user devices by user uuid
        const userDevicesList = await this.getUserDevicesByUserUUID(notification.UserUUID) as any;
        // for each user device send push notification
        for (const device of userDevicesList) {
            let pushNotification = {
                Message: notification.Body,
                Subject: notification.Subject,
                TargetArn: device.EndpointArn
            }
            const ans = await this.publish(pushNotification);
            console.log(ans);
        }
    }

    async getUserDevicesByUserUUID(userUUID) {
        try {
            const userDeviceResource = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).get(userUUID);
            return userDeviceResource.EndpointsARN;
        }
        catch (err) {
            console.log(err);
        }
    }

    //MARK: API Validation
    validateSchema(body: any, schema: any) {
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
            Platform: body.Platform,
            Attributes: {
                'PlatformCredential': body.Credential,// .p8
                'PlatformPrincipal': body.SigningKeyID,
                'ApplePlatformTeamID': body.TeamID,
                'ApplePlatformBundleID': body.BundleID
            }
        };
        return this.sns.createPlatformApplication(params).promise()
    }

    async getPlatformApplicationARN(appID) {
        const list = await this.sns.listPlatformApplications({}).promise();
        const currentApp = list.PlatformApplications.find(app => app.Attributes.ApplePlatformBundleID === appID);
        return currentApp.PlatformApplicationArn;
    }

    /*
    It will register mobile to platform application so that 
    if we send notification to platform application it 
    will send notifications to all mobile endpoints registered
    */
    createApplicationEndpoint(body) {
        const params = {
            PlatformApplicationArn: body.PlatformApplicationArn,
            Token: body.DeviceToken
        };
        return this.sns.createPlatformEndpoint(params).promise();
    }

    // publish to particular topic ARN or to endpoint ARN
    publish(body) {
        const params = {
            Message: body.Message,
            MessageStructure: 'STRING_VALUE',
            Subject: body.Subject,
            TargetArn: body.TargetArn
        };
        return this.sns.publish(params).promise();
    }
}

export default NotificationsService;