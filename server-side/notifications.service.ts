import { PapiClient, AddonData } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import {
    NOTIFICATIONS_TABLE_NAME, USER_DEVICE_TABLE_NAME, NOTIFICATIONS_LOGS_TABLE_NAME, NOTIFICATIONS_VARS_TABLE_NAME, notificationSchema, markAsReadSchema, userDeviceSchema, platformApplicationsSchema, UserDevice, HttpMethod,
    DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION, DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION, NotificationLog, Notification
} from '../shared/entities'
import * as encryption from '../shared/encryption-service'
import { Validator } from 'jsonschema';
import { v4 as uuid } from 'uuid';
import jwt from 'jwt-decode';
import { Agent } from 'https';
import fetch from 'node-fetch';
const AWS = require('aws-sdk');

abstract class PlatformBase {
    constructor(protected papiClient,
        protected sns) {
    }

    abstract createPlatformApplication(body: any): any;
    abstract publish(pushNotification: any, numberOfUnreadNotifications: Number): any;
}
class PlatformIOS extends PlatformBase {
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
            return this.sns.createPlatformApplication(params).promise();
    }

    createPayload(data, numberOfUnreadNotifications) {
        return {
            "default": `${data.Subject}`,
            "APNS_SANDBOX": JSON.stringify({
                "aps": {
                    "badge": numberOfUnreadNotifications,
                    "alert": {
                        "title": `${data.Subject}`,
                        "body": `${data.Message}`
                    }
                }
            })
        }
    }

    publish(pushNotification: any, numberOfUnreadNotifications): any {
        const payload = this.createPayload(pushNotification, numberOfUnreadNotifications);
        console.log("@@@payload: ", payload);
        console.log("@@@pushNotifications inside publish: ", pushNotification);
        const params = {
            Message: JSON.stringify(payload),
            MessageStructure: 'json',
            TargetArn: pushNotification.Endpoint
        };
        console.log("@@@params: ", params);
        return this.sns.publish(params).promise();
    }
}
class PlatformAndroid extends PlatformBase {
    createPlatformApplication(body: any): any {
        throw new Error("Not implemented");
    }

    publish(pushNotification: any, numberOfUnreadNotifications:Number): any {
        throw new Error("Not implemented");
    }
}
class PlatformAddon extends PlatformBase {
    createPlatformApplication(body: any): any {
        throw new Error("Not implemented");
    }

    publish(pushNotification: any, numberOfUnreadNotifications: Number): any {
        console.log("@@@pushNotifications inside Addon before publish: ", pushNotification);
        this.papiClient.post(pushNotification.Endpoint, pushNotification).then(console.log("@@@pushNotifications inside Addon after publish: ", pushNotification));
    }
}

class NotificationsService {
    sns: any;
    papiClient: PapiClient
    addonSecretKey: string
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
        this.addonSecretKey = client.AddonSecretKey ?? "";
        this.accessToken = client.OAuthAccessToken;

        // get user uuid from the token
        const parsedToken: any = jwt(this.accessToken)
        this.currentUserUUID = parsedToken.sub;

        this.sns = new AWS.SNS();
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
    getExpirationDateTime(days: number) {
        const daysToAdd = days * 24 * 60 * 60 * 1000 // ms * 1000 => sec. sec * 60 => min. min * 60 => hr. hr * 24 => day.
        return new Date(Date.now() + daysToAdd)
    }

    async getNumberOfUnreadNotifications() {
        let notifications = await  this.getNotifications({ where: `UserUUID='${this.currentUserUUID}'`});
        notifications.filter(notification => notification.Read == 'false');
        return notifications.length;
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
            const errors = validation.errors.map(error => {
                if (error.name === 'oneOf') {
                    return error.message = "Excactly one of the following properties is requierd: " + error.argument;
                }
                else {
                    return error.stack.replace("instance.", "");
                }
            });
            throw new Error(errors.join("\n"));
        }
    }

    // create a single notification after all conditions have been checked
    async createNotification(body) {
        const lifetimeSoftLimit = await this.getNotificationsSoftLimit();
        body.Key = uuid();
        body.CreatorUUID = this.currentUserUUID;
        body.Read = false;
        body.ExpirationDateTime = this.getExpirationDateTime(lifetimeSoftLimit[DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.key]);
        return this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).upsert(body);
    }

    async markNotificationsAsRead(body) {
        let readNotifications: AddonData[] = [];
        let validation = this.validateSchema(body, markAsReadSchema);
        if (validation.valid) {
            for (const notification of body.Keys) {
                //Protection against change of properties. The only property that can change is Read
                let currentNotification;
                await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).find({ where: `Key='${notification}'` }).then(res => {
                    currentNotification = res[0]
                });
                if (currentNotification != undefined) {
                    if (this.currentUserUUID === currentNotification.UserUUID) {
                        currentNotification.Read = true;
                        let ans = await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).upsert(currentNotification);
                        readNotifications.push(ans);
                    }
                    else {
                        let error: any = new Error(`The UserUUID is different from the notification UserUUID`);
                        error.code = 403;
                        throw error;
                    }
                }
            }
            return readNotifications;
        }    
        else {
            const errors = validation.errors.map(error => error.stack.replace("instance.", ""));
            throw new Error(errors.join("\n"));
        }
    }

    //MARK: UserDevice handling

    async getUserDevices(query) {
        const userDevices = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).find(query);
        return userDevices.map(device => {
            delete device.Token
            return device;
        });
    }

    async upsertUserDevice(body) {
        // Schema validation
        let validation = this.validateSchema(body, userDeviceSchema);
        if (validation.valid) {
            body.UserUUID = this.currentUserUUID;
            body.Key = `${body.UserUUID}_${body.DeviceKey}_${body.AppKey}`;

            // if device doesn't exist creates one, else aws createPlatformEndpoint does nothing
            const appARN: string = await this.getPlatformApplicationARN(body.AppKey);
            let endpointARN = await this.createApplicationEndpoint({
                AddonRelativeURL: body.AddonRelativeURL,
                PlatformType: body.PlatformType,
                PlatformApplicationArn: appARN,
                DeviceToken: body.Token
            });

            if (endpointARN != undefined) {
                body.Endpoint = endpointARN;
            }
            else {
                throw new Error("Register user device faild");
            }
            return await this.upsertUserDeviceResource(body);
        }
        else {
            const errors = validation.errors.map(error => error.stack.replace("instance.", ""));
            throw new Error(errors.join("\n"));
        }
    }

    async upsertUserDeviceResource(body) {
        body.Key = `${body.UserUUID}_${body.DeviceKey}_${body.AppKey}`;
        const userDevices = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).find({ where: `Key='${body.Key}'` }) as UserDevice[];

        // if there is a new token, then remove the endpoint with the old token
        if (userDevices.length != 0) {
            const userDeviceToken = await encryption.decryptSecretKey(userDevices[0].Token, this.addonSecretKey)
            if (body.Token != userDeviceToken)
                if (userDevices[0].Endpoint != undefined) {
                    await this.deleteApplicationEndpoint(userDevices[0].Endpoint);
                }
        }
        //Entries in the token details on the server are considered valid in case they were updated in the last 30 days
        body.ExpirationDateTime = this.getExpirationDateTime(30);
        body.Token = await encryption.encryptSecretKey(body.Token, this.addonSecretKey)

        const device = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).upsert(body);
        if (device) {
            delete device.Endpoint;
            delete device.Token;
            return device;
        }
    }
    // remove devices from ADAL by deviceKey , it will remove from AWS in ExpirationDateTime
    async removeDevices(body) {
        for (const device of body.DevicesKeys) {
            try {
                const deviceToRemove = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).get(device);
                deviceToRemove.Hidden = true;
                await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).upsert(deviceToRemove);
            }
            catch {
                console.log('device does not exist');
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
                            Endpoint: device.Endpoint,
                            DeviceType: device.DeviceType,
                            PlatformType: device.PlatformType
                        }
                        console.log("@@@pushNotification: ", pushNotification);
                        const ans = await this.publish(pushNotification);
                        console.log("@@@ans from publish: ", ans);
                    }
                }
            }
            catch (error) {
                console.log("@@@error", error);
            }

        }
    }

    async getUserDevicesByUserUUID(userUUID) {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).find({ where: `UserUUID='${userUUID}'` });
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
        // Schema validation
        let validation = this.validateSchema(body, platformApplicationsSchema);
        if (validation.valid) {
            let basePlatform: PlatformBase;

            switch (body.PlatformType) {
                case "iOS":
                    basePlatform = new PlatformIOS(this.papiClient, this.sns);
                    break;
                case "Android":
                    basePlatform = new PlatformAndroid(this.papiClient, this.sns);
                    break;
                case "Addon":
                    basePlatform = new PlatformAddon(this.papiClient, this.sns);
                    break;
                default:
                    throw new Error(`PlatformType not supported ${body.PlatformType}}`);
            }
            return basePlatform.createPlatformApplication(body)
        }
    }

    async getPlatformApplicationARN(appKey) {
        const list = await this.sns.listPlatformApplications({}).promise();
        const currentApp = list.PlatformApplications.find(app => app.Attributes.ApplePlatformBundleID === appKey);
        return currentApp.PlatformApplicationArn;
    }

    /*
    It will register mobile to platform application so that 
    if we send notification to platform application it 
    will send notifications to all mobile endpoints registered
    */
    async createApplicationEndpoint(body) {
        switch (body.PlatformType) {
            case "Addon":
                return body.AddonRelativeURL;
            default:
                const params = {
                    PlatformApplicationArn: body.PlatformApplicationArn,
                    Token: body.DeviceToken
                };
                const Endpoint = await this.sns.createPlatformEndpoint(params).promise();
                return Endpoint.EndpointArn;
        }
    }

    async deleteApplicationEndpoint(endpointARN) {
        const params = {
            EndpointArn: endpointARN
        };
        return await this.sns.deleteEndpoint(params).promise();
    }

    async deleteAllApplicationEndpoints() {
        let devices = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).find();

        for (let device of devices) {
            await this.deleteApplicationEndpoint(device.Endpoint);
        }
    }

    // publish to particular topic ARN or to endpoint ARN
    publish(pushNotification) {
        let basePlatform: PlatformBase;

        switch (pushNotification.PlatformType) {
            case "iOS":
                basePlatform = new PlatformIOS(this.papiClient, this.sns);
                break;
            case "Android":
                basePlatform = new PlatformAndroid(this.papiClient, this.sns);
                break;
            case "Addon":
                console.log("@@@switchCase addon: ", pushNotification);
                basePlatform = new PlatformAddon(this.papiClient, this.sns);
                break;
            default:
                throw new Error(`PlatformType not supported ${pushNotification.PlatformType}}`);
        }
        let numberOfUnreadNotifications = 0;
        this.getNumberOfUnreadNotifications().then(notifications => {
            numberOfUnreadNotifications = notifications;
        });
        return basePlatform.publish(pushNotification, numberOfUnreadNotifications)
    }

    //remove endpoint ARN
    async removeUserDeviceEndpoint(body) {
        for (const object of body.Message.ModifiedObjects) {
            if (object.EndpointARN != undefined) {
                await this.deleteApplicationEndpoint(object.EndpointARN);
            }
            else {
                console.log("Device endpoint does not exist");
            }
        }
    }

    //DIMX 
    async importNotificationsSource(body) {
        for (const dimxObj of body.DIMXObjects) {
            // Upsert not support. only create.
            if (dimxObj.Object.Key != undefined) {
                dimxObj.Status = Error;
                dimxObj.Details = `${JSON.stringify(dimxObj.Object)} faild with the following error: Key is read-only property`
            }
            dimxObj.Object.Key = uuid();
            dimxObj.Object.CreatorUUID = this.currentUserUUID;

            // USERUUID and Email are mutually exclusive
            let isUserEmailProvided = dimxObj.Object.Email !== undefined;
            let isUserUUIDProvided = dimxObj.Object.USERUUID !== undefined;
            // consider !== as XOR
            if (isUserEmailProvided !== isUserUUIDProvided) {
                // find user uuid by Email
                if (dimxObj.Object.Email !== undefined) {
                    const userUUID = await this.getUserUUIDByEmail(dimxObj.Object.Email)
                    // The Email is not compatible with any UserUUID
                    if (userUUID !== undefined) {
                        delete dimxObj.Object.Email;
                        dimxObj.Object.UserUUID = userUUID;
                    }
                    else {
                        dimxObj.Status = Error;
                        dimxObj.Details = `${JSON.stringify(dimxObj.Object.Email)} faild with the following error: The given Email is not compatible with any UserUUID`
                    }
                }
            }
            else {
                dimxObj.Status = Error;
                dimxObj.Details = `${JSON.stringify(dimxObj.Object)} faild with the following error: USERUUID and Email are mutually exclusive`
            }
        }
        console.log("@@@@import end body: ", body);
        return body;
    }

    // create notifications using DIMX
    async bulkNotifications(body): Promise<any> {
        let ans = await this.upsertNotificationLog(body);
        console.log('ans from upload notifications log', ans);

        if (body.UserEmailList != undefined) {
            if (body.UserEmailList.length > 100) {
                throw new Error('Max 100 hard coded users');
            }
            else {
                let notifications: Notification[] = [];
                for (let email of body.UserEmailList) {
                    let notification: Notification = {
                        "Email": email,
                        "Title": body.Title,
                        "Body": body.Body,
                    }
                    notifications.push(notification);
                }
                return await this.uploadFileAndImport(notifications);
            }
        }
    }

    async uploadFileAndImport(body) {
        let fileURL = await this.uploadObject();
        //upload Object To S3
        await this.apiCall('PUT', fileURL.PresignedURL, body).then((res) => res.text());
        if (fileURL != undefined && fileURL.URL != undefined) {
            const file = {
                'URI': fileURL.URL,
                'OverwriteObject': false,
                'Delimiter': ';',
                "Version": "1.0.3"
            }
            const url = `/addons/data/import/file/${this.addonUUID}/${NOTIFICATIONS_TABLE_NAME}`
            const ansFromImport = await this.papiClient.post(url, file);
            const ansFromAuditLog = await this.pollExecution(this.papiClient, ansFromImport.ExecutionUUID);
            if (ansFromAuditLog.success === true) {
                const downloadURL = JSON.parse(ansFromAuditLog.resultObject).DownloadURL;
                return await this.DownloadResultArray(downloadURL);
            }
            return ansFromAuditLog;
        }
    }

    async DownloadResultArray(downloadURL): Promise<any[]> {
        console.log(`OutputArrayObject: Downloading file`);
        try {
            const response = await fetch(downloadURL);
            const data: string = await response.text();
            const DIMXObjectArr: any[] = JSON.parse(data);
            return DIMXObjectArr;
        }
        catch (ex) {
            console.log(`DownloadResultArray: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async uploadObject() {
        const url = `/addons/files/${this.addonUUID}`
        let expirationDateTime = new Date();
        expirationDateTime.setDate(expirationDateTime.getDate() + 1);
        const body = {
            "Key": "/tempBulkAPI/" + uuid() + ".json",
            "MIME": "application/json",
            "ExpirationDateTime": expirationDateTime
        }
        return await this.papiClient.post(url, body);
    }

    async apiCall(method: HttpMethod, url: string, body: any = undefined) {

        const agent = new Agent({
            rejectUnauthorized: false,
        })

        const options: any = {
            method: method,
            agent: agent,
            headers: { 'Content-Type': 'application/json' }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const res = await fetch(url, options);


        if (!res.ok) {
            // try parsing error as json
            let error = '';
            try {
                error = JSON.stringify(await res.json());
            } catch { }

            throw new Error(`${url} failed with status: ${res.status} - ${res.statusText} error: ${error}`);
        }
        return res;
    }


    async pollExecution(papiClient: PapiClient, ExecutionUUID: string, interval = 1000, maxAttempts = 60, validate = (res) => {
        return res != null && (res.Status.Name === 'Failure' || res.Status.Name === 'Success');
    }) {
        let attempts = 0;

        const executePoll = async (resolve, reject) => {
            const result = await papiClient.get(`/audit_logs/${ExecutionUUID}`);
            attempts++;

            if (validate(result)) {
                return resolve({ "success": result.Status.Name === 'Success', "errorCode": 0, 'resultObject': result.AuditInfo.ResultObject });
            }
            else if (maxAttempts && attempts === maxAttempts) {
                return resolve({ "success": false, "errorCode": 1 });
            }
            else {
                setTimeout(executePoll, interval, resolve, reject);
            }
        };

        return new Promise<any>(executePoll);
    }

    async getNotificationsSoftLimit() {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_VARS_TABLE_NAME).key(NOTIFICATIONS_VARS_TABLE_NAME).get();
    }

    async setNotificationsSoftLimit(varSettings) {
        const notificationsNumberLimitation = Number(varSettings[DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION.key]);
        const notificationsLifetimeLimitationValue = Number(varSettings[DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.key]);

        if (!isNaN(notificationsNumberLimitation) && !isNaN(notificationsLifetimeLimitationValue)) {
            if (notificationsNumberLimitation < 1 || notificationsNumberLimitation > DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION.hardValue) {
                throw new Error(`${DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION.key} should be in the range (1 - ${DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION.hardValue}).`);
            }

            if (notificationsLifetimeLimitationValue < 1 || notificationsLifetimeLimitationValue > DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.hardValue) {
                throw new Error(`${DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.key} should be in the range (1 - ${DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.hardValue}).`);
            }

            // Save the key on the object for always work on the same object.
            varSettings['Key'] = NOTIFICATIONS_VARS_TABLE_NAME;
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_VARS_TABLE_NAME).upsert(varSettings);
        } else {
            let nanVariableName = isNaN(notificationsNumberLimitation) ? DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION.key : DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.key;
            throw new Error(`${nanVariableName} is not a number.`);
        }
    }

    // Usage monitor

    async getTotalNotificationsSentperDay() {
        const today = new Date();
        let totalNotifications: Notification[] = [];
        await this.getNotifications({}).then(notifications => {
            totalNotifications = notifications.filter(notification => {
                const creationsDateTime = new Date(notification.CreationDateTime ?? "")
                // comparison only of the days without the hours
                return creationsDateTime.toISOString().split('T')[0] === today.toISOString().split('T')[0];
            }) as Notification[];
        });
        return {
            Title: "Usage",
            "Resources": [
                {
                    "Data": "Daily Notifications Count",
                    "Description": "Number of Notifications sent per day",
                    "Size": totalNotifications.length
                },
            ],
            "ReportingPeriod": "Weekly",
            "AggregationFunction": "LAST"
        }
    }

    async getTotalNotificationsSentInTheLastWeekUsageData() {
        const daysToSubstract = 7 * 24 * 60 * 60 * 1000 // ms * 1000 => sec. sec * 60 => min. min * 60 => hr. hr * 24 => day.
        let firstDate = new Date(Date.now() - daysToSubstract)

        const totalNotifications = await this.getNotifications({ where: `CreationDateTime>'${firstDate}'` });
        return {
            Title: "Usage",
            "Resources": [
                {
                    "Data": "Total Notifications",
                    "Description": "Total Notifications Sent in The Last 7 Days",
                    "Size": totalNotifications.length
                },
            ],
            "ReportingPeriod": "Weekly",
            "AggregationFunction": "LAST"
        }
    }

    // Notifications Log
    async getNotificationsLog() {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_LOGS_TABLE_NAME).find({ where: `CreatorUUID='${this.currentUserUUID}'` });
    }

    async upsertNotificationLog(body) {
        //for later version
        //const users = await this.papiClient.users.find();
        // let usersList: string[] = [];

        // for (let userEmail of body.UserEmailList) {
        //     let user = users.find(u => u.Email == userEmail);
        //     let userName = user?.FirstName + ' ' + user?.LastName;
        //     usersList.push(userName);
        // }

        let notificationLog: NotificationLog = {
            'CreatorUUID': this.currentUserUUID,
            'UsersList': body.UserEmailList,
            'Title': body.Title,
            'Body': body.Body,
            'Key': uuid()

        };

        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_LOGS_TABLE_NAME).upsert(notificationLog);
    }

    async duplicateNotifications(body) {
        let ansArray: any[] = [];
        for (const notificationKey of body.Keys) {
            let notificationLog = await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_LOGS_TABLE_NAME).find({ where: `Key='${notificationKey}'` }) as NotificationLog[];
            if (notificationLog[0] != undefined) {
                let ans = await this.bulkNotifications(
                    {
                        "UserEmailList": notificationLog[0].UsersList,
                        "Title": notificationLog[0].Title,
                        "Body": notificationLog[0].Body
                    });
                    ansArray.push(ans);
            }
            return ansArray;
        }
    }
}

export default NotificationsService;