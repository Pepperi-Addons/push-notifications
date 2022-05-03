import { PapiClient, InstalledAddon, AddonData } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { NOTIFICATIONS_TABLE_NAME, USER_DEVICE_TABLE_NAME, notificationSchema, userDeviceSchema, UserDevice } from '../shared/entities'
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
    createPNSSubscriptionForUserDeviceRemoval() {
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

    createPNSSubscriptionForNotificationInsert() {
        return this.papiClient.notification.subscriptions.upsert({
            AddonUUID: this.addonUUID,
            AddonRelativeURL: "/api/notification_inserted",
            Type: "data",
            Name: "notificationInsertionSubscription",
            FilterPolicy: {
                Action: ['insert'],
                Resource: [NOTIFICATIONS_TABLE_NAME],
                AddonUUID: [this.addonUUID]
            }
        });
    }

    async getUserUUIDByEmail(userEmail) {
        const users = await this.papiClient.users.find();
        let userUUID = users.find(u => u.Email == userEmail)?.UUID
        return userUUID;
    }

    createPayload(data) {
        if (data.DeviceType.includes("iPhone") || data.DeviceType.includes("iPad")) {
            return {
                "default": `${data.Subject}`,
                "APNS_SANDBOX": JSON.stringify({
                    "aps": {
                        "alert": {
                            "title": `${data.Subject}`,
                            "body": `${data.Message}`
                        }
                    }
                })
            }
        }
    }

    // For page block template
    upsertRelation(relation): Promise<any> {
        return this.papiClient.post('/addons/data/relations', relation);
    }

    async getNotifications(query) {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).find(query);
    }

    async upsertNotification(body) {
        //Check that the user did not send a key
        if (body.Key != undefined) {
            throw new Error(`Key is read-only property`);
        }
        if (body.Title === undefined) {
            throw new Error(`Title is a mandatory property`);
        }
        // Schema validation
        let validation = this.validateSchema(body, notificationSchema);
        if (validation.valid) {
            // replace mail by UserUUID
            if (body.Email !== undefined) {
                const userUUID = await this.getUserUUIDByEmail(body.Email)
                if (userUUID != undefined) {
                    body.UserUUID = userUUID;
                    delete body.Email;
                }
                else {
                    throw new Error(`User with Email: ${body.Email} does not exist`);
                }
            }
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
            const errors = validation.errors.map(error => error.stack.replace("instance.", ""));
            throw new Error(errors.join("\n"));
        }
    }

    // create a single notification after all conditions have been checked
    async createNotification(body) {
        body.Key = uuid();
        body.CreatorUUID = this.currentUserUUID;
        //this.sendPushNotification(body);
        return this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).upsert(body);
    }

    async markNotificationsAsRead(body) {
        let readNotifications: AddonData[] = [];
        for (const notification of body.Keys) {
            //Protection against change of properties. The only property that can change is Read
            try {
                let currentNotification = await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).key(notification).get();
                if (this.currentUserUUID === currentNotification.UserUUID) {
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

    async getUserDevices(query) {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).find(query)
    }

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
                body.UserID = this.currentUserUUID;
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
        let expirationDateTime = new Date();
        expirationDateTime.setDate(expirationDateTime.getDate() + 30);

        userDevice = {
            "Key": `${body.UserID}_${body.DeviceID}_${body.AppID}`,
            "UserID": body.UserID,
            "AppID": body.AppID,
            "AppName": body.AppName,
            "DeviceID": body.DeviceID,
            "DeviceName": body.DeviceName,
            "DeviceType": body.DeviceType,
            "Token": body.Token,
            "Endpoint": "",
            "ExpirationDateTime": expirationDateTime
        };
        userDevice.Endpoint = endpointARN;
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).upsert(userDevice);
    }
    // remove devices both from ADAL and SNS
    async removeDevices(body) {
        for (const device of body.DevicesKeys) {
            try {
                const deviceToRemove = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).get(device);
                deviceToRemove.Hidden = true;
                await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).upsert(deviceToRemove);
            }
            catch {

            }
        }
    }
    // called by PNS when a notification is created
    async sendPushNotification(body) {
        for (const object of body.Message.ModifiedObjects) {
            try {
                const notification = await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).key(object.ObjectKey).get();
                //get user devices by user uuid
                const userDevicesList = await this.getUserDevicesByUserUUID(notification.UserUUID) as any;
                if (userDevicesList != undefined) {
                    // for each user device send push notification
                    for (const device of userDevicesList) {
                        let pushNotification = {
                            Message: notification.Body ?? "",
                            Subject: notification.Title,
                            TargetArn: device.Endpoint.EndpointArn,
                            DeviceType: device.DeviceType
                        }
                        const ans = await this.publish(pushNotification);
                        console.log("@@@: ", ans);
                    }
                }
            }
            catch {
                console.log("@@@Notification does not exist");
            }

        }
    }

    async getUserDevicesByUserUUID(userUUID) {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).find({ where: `UserID='${userUUID}'` });
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
        const payload = this.createPayload(body);
        const params = {
            Message: JSON.stringify(payload),
            MessageStructure: 'json',
            TargetArn: body.TargetArn
        };
        return this.sns.publish(params).promise();
    }

    //remove endpoint ARN
    async removeUserDeviceEndpoint(body) {
        for (const object of body.Message.ModifiedObjects) {
            if (object.EndpointARN != undefined) {
                const params = {
                    EndpointArn: object.EndpointARN
                };
                await this.sns.deleteEndpoint(params).promise();
            }
            else {
                console.log("Device endpoint does not exist");
            }
        }
    }

    //DIMX 
    async importNotificationsSource(body) {
        for (var dimxObj of body.DIMXObjects) {
            // Upsert not support. only create.
            if (dimxObj.Object.Key != undefined) {
                throw new Error(`Key is read-only property`);
            }
            // USERUUID and Email are mutually exclusive
            let isUserEmailProvided = dimxObj.Object.Email !== undefined;
            let isUserUUIDProvided = dimxObj.Object.USERUUID !== undefined;
            // consider !== as XOR
            if (isUserEmailProvided !== isUserUUIDProvided) {
                body.DIMXObjects.remove(dimxObj);
                continue;
            }
            // find user uuid by Email
            else if (dimxObj.Object.Email !== undefined) {
                const userUUID = await this.getUserUUIDByEmail(dimxObj.Object.Email)
                if (userUUID !== undefined) {
                    delete dimxObj.Object.Email;
                    dimxObj.Object.UserUUID = userUUID;
                }
            }
        }
        return body;
    }

}

export default NotificationsService;