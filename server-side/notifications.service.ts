import { PapiClient, AddonData } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { User } from '@pepperi-addons/papi-sdk';
import {
    NOTIFICATIONS_TABLE_NAME, USER_DEVICE_TABLE_NAME, PLATFORM_APPLICATION_TABLE_NAME, NOTIFICATIONS_LOGS_TABLE_NAME, PFS_TABLE_NAME, NOTIFICATIONS_VARS_TABLE_NAME, notificationOnCreateSchema, notificationOnUpdateSchema, userDeviceSchema, platformApplicationsSchema, platformApplicationsIOSSchema, UserDevice, HttpMethod,
    DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION, DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION, NotificationLog, Notification
} from 'shared'
import * as encryption from 'shared'
import { Validator } from 'jsonschema';
import { v4 as uuid } from 'uuid';
import jwt from 'jwt-decode';
import { Agent } from 'https';
import fetch from 'node-fetch';
import AWS, { SNS } from 'aws-sdk';

abstract class PlatformBase {
    constructor(protected papiClient,
        protected sns) {
    }

    abstract createPlatformApplication(body: any): any;
    abstract publish(pushNotification: any, numberOfUnreadNotifications: Number): any;
}
class PlatformIOS extends PlatformBase {
    async createPlatformApplication(body) {
        const params = {
            Name: body.AppKey,
            Platform: "APNS",
            Attributes: {
                'PlatformCredential': body.Credential,// .p8
                'PlatformPrincipal': body.AppleSigningKeyID,
                'ApplePlatformTeamID': body.AppleTeamID,
                'ApplePlatformBundleID': body.AppKey
            }
        };
        return await this.sns.createPlatformApplication(params).promise();
    }

    createPayload(data, numberOfUnreadNotifications) {
        let jsonData = JSON.stringify({ Notification: data.Notification})
        return {
            "default": `${data.Notification.Title}`,
            "APNS": JSON.stringify({
                "aps": {
                    "eventData": jsonData,
                    "badge": numberOfUnreadNotifications,
                    "alert": {
                        "title": `${data.Notification.Title}`,
                        "body": `${data.Notification.Body}`,
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
    async createPlatformApplication(body) {
        const params = {
            Name: body.AppKey,
            Platform: "GCM",
            Attributes: {
                'PlatformCredential': body.Credential,// API Key
            }
        };
        return await this.sns.createPlatformApplication(params).promise();
    }

    createPayload(data, numberOfUnreadNotifications) {
        console.log("@@@Android payload data", data)
        let id = NotificationsService.hashCode(data.Notification.Key)
        let jsonData = JSON.stringify({ Notification: data.Notification})
        console.log("@@@Android jsonData", jsonData)
        return {
            "default": `${data.Notification.Title}`,
            "GCM": JSON.stringify(
                {
                    "data": {
                        "badge": `${numberOfUnreadNotifications}`,
                        "id": `${id}`,
                        "eventData": jsonData
                    }
                }
            )
        }
    }

    publish(pushNotification: any, numberOfUnreadNotifications: Number): any {
        const payload = this.createPayload(pushNotification, numberOfUnreadNotifications);
        const params = {
            Message: JSON.stringify(payload),
            MessageStructure: 'json',
            TargetArn: pushNotification.Endpoint
        };
        console.log("@@@params: ", params);
        return this.sns.publish(params).promise();
    }
}
class PlatformAddon extends PlatformBase {
    createPlatformApplication(body: any): any {
        throw new Error("Not implemented");
    }

    publish(pushNotification: any, numberOfUnreadNotifications: Number): any {
        console.log("@@@pushNotifications inside Addon before publish: ", pushNotification);
        return this.papiClient.post(pushNotification.Endpoint, pushNotification).then(console.log("@@@pushNotifications inside Addon after publish: ", pushNotification));
    }
}

class NotificationsService {
    sns: SNS;
    papiClient: PapiClient
    addonSecretKey: string
    addonUUID: string;
    accessToken: string;
    currentUserUUID: string;
    currentUserName: string = "";

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
        this.getUserName(this.currentUserUUID).then((res) => this.currentUserName = res ?? "");

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

    // subscribe to remove platform application from SNS when the expiration date arrives 
    createPNSSubscriptionForPlatformApplicationRemoval() {
        return this.papiClient.notification.subscriptions.upsert({
            AddonUUID: this.addonUUID,
            AddonRelativeURL: "/api/platform_removed",
            Type: "data",
            Name: "applicationRemovalSubscription",
            FilterPolicy: {
                Action: ['remove'],
                Resource: [PLATFORM_APPLICATION_TABLE_NAME],
                AddonUUID: [this.addonUUID]
            }
        });
    }

    async getUserUUIDByEmail(userEmail) {
        const users = await this.papiClient.users.find();
        let userUUID = users.find(u => u.Email == userEmail)?.UUID
        if (userUUID != undefined) {
            return userUUID;
        }
        else {
            throw new Error(`User with Email: ${userEmail} does not exist`);
        }
    }

    async getUserName(userUUID: string) {
        const user: User = await this.papiClient.users.uuid(userUUID).get();
        if (user != undefined) {
            return (user.FirstName ?? "") + (user.LastName ?? "") 
        }
    }

    getExpirationDateTime(days: number) {
        const daysToAdd = days * 24 * 60 * 60 * 1000 // ms * 1000 => sec. sec * 60 => min. min * 60 => hr. hr * 24 => day.
        return new Date(Date.now() + daysToAdd)
    }

    async getNumberOfUnreadNotifications() {
        let notifications = await this.getNotifications({ where: `Read=${false} And UserUUID='${this.currentUserUUID}'` });
        return notifications.length;
    }

    public static hashCode(str) {
        let hash = 0, i, chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
          chr   = str.charCodeAt(i);
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }     
        // check if hashCode is positive number
        if (hash < 0) {
            // make it positive number
            hash = hash * -1;
        }   
        return hash;
    }

    // For page block template
    upsertRelation(relation): Promise<any> {
        return this.papiClient.post('/addons/data/relations', relation);
    }

    async getNotifications(query) {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).iter(query).toArray();
    }

    async upsertNotification(body) {
        if (body.Key != undefined) {
            return await this.updateNotification(body);
        }
        else {
            return this.createNotification(body);
        }
    }

    // create a single notification
    async createNotification(body) {
        let validation = this.validateSchema(body, notificationOnCreateSchema);
        if (validation.valid) {
            // replace Email by UserUUID
            if (body.UserEmail !== undefined) {
                body.UserUUID = await this.getUserUUIDByEmail(body.UserEmail);
                delete body.UserEmail;
            }
            else {
                // Check that the UserUUID the client provided exists in the users list
                try {
                    await this.papiClient.get(`/users/uuid/${body.UserUUID}`)
                }
                catch {
                    throw new Error(`User with UserUUID: {UserUUID} does not exist`);
                }
            }
            const lifetimeSoftLimit = await this.getNotificationsSoftLimit();
            body.Key = uuid();
            body.CreatorUUID = this.currentUserUUID;
            body.CreatorName = this.currentUserName;
            body.Read = false;
            body.ExpirationDateTime = this.getExpirationDateTime(lifetimeSoftLimit[DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.key]);
            return this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).upsert(body);
        }
        else {
            const errors = validation.errors.map(error => {
                if (error.name === 'oneOf') {
                    return error.message = "Exactly one of the following properties is required: " + error.argument;
                }
                else {
                    return error.stack.replace("instance.", "");
                }
            });
            throw new Error(errors.join("\n"));
        }
    }

    async updateNotification(body) {
        let validation = this.validateSchema(body, notificationOnUpdateSchema);
        if (validation.valid) {
            let notifications = await this.getNotifications({ where: `Key='${body.Key}'` })
            let notification = notifications.length > 0 ? notifications[0] : undefined
            if (notification) {
                notification.Hidden = body.Hidden
                notification.Read = body.Read
                return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).upsert(notification);
            }
            else {
                throw new Error(`Could not find a notification matching this Key`);
            }
        }
        else {
            const errors = validation.errors.map(error => {
                if (error.name === 'anyOf') {
                    return error.message = "One of the following properties is required: " + error.argument;
                }
                else {
                    return error.stack.replace("instance.", "");
                }
            });
            throw new Error(errors.join("\n"));
        }
    }

    async updateNotificationReadStatus(body) {
        let notifications: Notification[] = [];
        for (let key of body.Keys) {
            let notification: Notification = {
                "Key": key,
                "Read": body.Read
            }
            notifications.push(notification);
        }
        return await this.uploadFileAndImport(notifications);
    }

    //MARK: UserDevice handling

    async getUserDevices(query) {
        const userDevices = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).iter(query).toArray();
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
            body.Key = `${body.DeviceKey}_${body.AppKey}`;
            body.LastRegistrationDate = new Date().toISOString();

            // if device doesn't exist creates one, else aws createPlatformEndpoint does nothing
            const pushNotificationsPlatform = body.PlatformType == "Android" ? "GCM" : "APNS";
            const awsID = process.env.AccountID;
            const region = process.env.AWS_REGION
            console.log("@@@awsID:", awsID);
            console.log("@@@region:", region);
            const appARN = `arn:aws:sns:${region}:${awsID}:app/${pushNotificationsPlatform}/${body.AppKey}`;
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
            this.throwErrorFromSchema(validation);
        }
    }

    async upsertUserDeviceResource(body) {
        body.Key = `${body.DeviceKey}_${body.AppKey}`;
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
        console.log("@@@pushNotification body: ", body);
        for (const object of body.Message.ModifiedObjects) {
            try {
                console.log("@@@pushNotification object: ", object);
                const notification = await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).key(object.ObjectKey).get();
                //get user devices by user uuid
                const userDevicesList: UserDevice[] = await this.getUserDevicesByUserUUID(notification.UserUUID) as any;
                console.log("@@@pushNotification userDevicesList: ", userDevicesList);
                if (userDevicesList != undefined) {
                    // for each user device send push notification
                    await Promise.all(userDevicesList.map(async(device) => {
                        try {
                            let pushNotification = {
                                Notification: notification,
                                Endpoint: device.Endpoint,
                                DeviceType: device.DeviceType,
                                PlatformType: device.PlatformType
                            }
                            console.log("@@@pushNotification: ", pushNotification);
                            const ans = await this.publish(pushNotification);
                            console.log("@@@ans from publish: ", ans);
                        }
                        catch(error) {
                            console.log("@@@error single publish faild", error);
                        }
                    }));
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

    throwErrorFromSchema(validation) {
        const errors = validation.errors.map(error => error.stack.replace("instance.", ""));
        throw new Error(errors.join("\n"));
    }

    async upsertPlatformApplication(body) {
        if (body.Key != undefined) {
            return await this.updatePlatformApplication(body);
        }
        else {
            return await this.createPlatformApplication(body);
        }
    }

    async updatePlatformApplication(body) {
        let application = await this.getPlatformApplication({ where: `Key='${body.Key}'` });
        if (application.length > 0) {
            application[0].Hidden = body.Hidden
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(PLATFORM_APPLICATION_TABLE_NAME).upsert(application[0]);
        }
        else {
            throw new Error("platform with the given key does not exist");
        }
    }

    async getPlatformApplication(query) {
        let applications = await this.papiClient.addons.data.uuid(this.addonUUID).table(PLATFORM_APPLICATION_TABLE_NAME).find(query);
        applications = applications.map(app => {
            delete app.ApplicationARN
            return app
        });
        return applications;
    }

    // MARK: AWS endpoints
    // Create PlatformApplication in order to register users mobile endpoints .
    async createPlatformApplication(body) {
        // Schema validation
        let validation = this.validateSchema(body, platformApplicationsSchema);
        if (validation.valid) {
            // dist can have only one iOS & one Android platform
            let applications = await this.getPlatformApplication({ where: `Type='${body.Type}'` });
            if (applications.length > 0) {
                let error: any = new Error(`Platform for '${body.Type}' already exists`);
                error.code = 403;
                throw error;
            }

            let basePlatform: PlatformBase;

            switch (body.Type) {
                case "iOS":
                    let validation = this.validateSchema(body, platformApplicationsIOSSchema);
                    if (validation.valid) {
                        basePlatform = new PlatformIOS(this.papiClient, this.sns);
                        break;
                    }
                    else {
                        this.throwErrorFromSchema(validation);
                    }
                case "Android":
                    basePlatform = new PlatformAndroid(this.papiClient, this.sns);
                    break;
                case "Addon":
                    basePlatform = new PlatformAddon(this.papiClient, this.sns);
                    break;
                default:
                    throw new Error(`Type not supported ${body.PlatformType}}`);
            }

            let application = await basePlatform.createPlatformApplication(body)

            if (application.PlatformApplicationArn != undefined) {
                return await this.papiClient.addons.data.uuid(this.addonUUID).table(PLATFORM_APPLICATION_TABLE_NAME).upsert({
                    "ApplicationARN": application.PlatformApplicationArn,
                    "Type": body.Type,
                    "Key": `${body.Type}_${body.AppKey}`
                });
            }
            else {
                console.log("application", application)
            }
        }
        else {
            this.throwErrorFromSchema(validation);
        }
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
                console.log("@@@createApplicationEndpoint: body :", body);
                const params = {
                    PlatformApplicationArn: body.PlatformApplicationArn,
                    Token: body.DeviceToken
                };
                const Endpoint = await this.sns.createPlatformEndpoint(params).promise();
                console.log("@@@Endpoint:", Endpoint);
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
        let devices = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).iter().toArray();

        for (let device of devices) {
            await this.deleteApplicationEndpoint(device.Endpoint);
        }
    }

    async deleteAllPlatformsApplication() {
        let platforms = await this.papiClient.addons.data.uuid(this.addonUUID).table(PLATFORM_APPLICATION_TABLE_NAME).iter().toArray();

        for (let platform of platforms) {
            await this.deleteApplication(platform.ApplicationARN);
        }
    }

    async deleteApplication(platformArn) {
        const params = {
            PlatformApplicationArn: platformArn
        };
        return await this.sns.deletePlatformApplication(params).promise();
    }

    // publish to particular topic ARN or to endpoint ARN
    async publish(pushNotification) {
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
        let numberOfUnreadNotifications = await this.getNumberOfUnreadNotifications();
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

    async removePlatformApplication(body) {
        for (const object of body.Message.ModifiedObjects) {
            if (object.EndpointARN != undefined) {
                await this.deleteApplicationEndpoint(object.ApplicationARN);
            }
            else {
                console.log("Device endpoint does not exist");
            }
        }
    }

    //DIMX 
    async importNotificationsSource(body) {
        for (const dimxObj of body.DIMXObjects) {
            //upsert notifications
            if (dimxObj.Object.Key != undefined) {
                // do nothing, forward the body to DIMX as is.
                console.log("@@@upsert notification", dimxObj.Object);
            }
            // create notifications
            else {
                dimxObj.Object.Key = uuid();
                dimxObj.Object.CreatorUUID = this.currentUserUUID;

                // USERUUID and UserEmail are mutually exclusive
                let isUserEmailProvided = dimxObj.Object.UserEmail !== undefined;
                let isUserUUIDProvided = dimxObj.Object.UserUUID !== undefined;
                // consider !== as XOR
                if (isUserEmailProvided !== isUserUUIDProvided) {
                    // find user uuid by Email
                    if (dimxObj.Object.UserEmail !== undefined) {
                        let userUUID;
                        try {
                             userUUID = await this.getUserUUIDByEmail(dimxObj.Object.UserEmail);
                        }
                        catch {
                            userUUID = undefined
                        }
                        // The UserEmail is not compatible with any UserUUID
                        if (userUUID !== undefined) {
                            delete dimxObj.Object.UserEmail;
                            dimxObj.Object.UserUUID = userUUID;
                        }
                        else {
                            dimxObj.Status = Error;
                            dimxObj.Details = `${JSON.stringify(dimxObj.Object.UserEmail)} faild with the following error: The given Email is not compatible with any UserUUID`
                        }
                    }
                }
                else {
                    dimxObj.Status = Error;
                    dimxObj.Details = `${JSON.stringify(dimxObj.Object)} faild with the following error: USERUUID and UserEmail are mutually exclusive`
                }
            }
        }
        console.log("@@@@import end body: ", body);
        return body;
    }

    // create notifications using DIMX
    async bulkNotifications(body): Promise<any> {
        let ans = await this.upsertNotificationLog(body);
        console.log('ans from upload notifications log', ans);

        if (body.UsersUUID != undefined) {
            if (body.UsersUUID.length > 100) {
                throw new Error('Max 100 hard coded users');
            }
            else {
                let notifications: Notification[] = [];
                for (let uuid of body.UsersUUID) {
                    let notification: Notification = {
                        "UserUUID": uuid,
                        "Title": body.Title,
                        "Body": body.Body,
                        "CreatorName": this.currentUserName,
                        "Read": body.Read ?? false
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
                const downloadURL = JSON.parse(ansFromAuditLog.resultObject).URI;
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
        const url = `/addons/pfs/${this.addonUUID}/${PFS_TABLE_NAME}`
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
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_LOGS_TABLE_NAME).iter({ where: `CreatorUUID='${this.currentUserUUID}'` }).toArray();
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
            'UsersList': body.Email,
            'Title': body.Title,
            'Body': body.Body,
            'Key': uuid()

        };

        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_LOGS_TABLE_NAME).upsert(notificationLog);
    }

    async deleteNotificationsLog(notifications) {
        const ansArray = notifications.map(notification => {
            return this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_LOGS_TABLE_NAME).upsert(
                {
                    'Key': notification,
                    'Hidden': true
                }
            );
        })
        const ans = await Promise.all(ansArray);
        return ans;
    }
}

export default NotificationsService;