import { PapiClient, AddonData } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { NOTIFICATIONS_TABLE_NAME, USER_DEVICE_TABLE_NAME, notificationSchema, userDeviceSchema, UserDevice, HttpMethod } from '../shared/entities'
import { Validator } from 'jsonschema';
import { v4 as uuid } from 'uuid';
import jwt from 'jwt-decode';
import { Agent } from 'https';
import fetch from 'node-fetch';
const AWS = require('aws-sdk');

abstract class PlatformBase {
    sns: any;

    constructor(protected papiClient) {
        this.sns = new AWS.SNS();
    }

    abstract publish(pushNotification: any): any;
}
class PlatformIOS extends PlatformBase {

    createPayload(data) {
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

    publish(pushNotification: any): any {
        const payload = this.createPayload(pushNotification);
        const params = {
            Message: JSON.stringify(payload),
            MessageStructure: 'json',
            Endpoint: pushNotification.Endpoint.EndpointARN
        };
        return this.sns.publish(params).promise();
    }
}
class PlatformAndroid extends PlatformBase {
    publish(pushNotification: any): any {
        throw new Error("Not implemented");
        
    }
}
class PlatformAddon extends PlatformBase {
    publish(pushNotification: any): any {
        this.papiClient.post(pushNotification.Endpoint, pushNotification);
    }
}

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

    async upsertUserDevice(body) {
        // Schema validation
        let validation = this.validateSchema(body, userDeviceSchema);
        if (validation.valid) {
            body.Key = `${body.UserUUID}_${body.DeviceKey}_${body.AppKey}`;
            body.UserUUID = this.currentUserUUID;
            const userDevices = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).find({ where: `Key='${body.Key}'` }) as UserDevice[];

            // if device doesn't exist, create one
            if (userDevices.length === 0) {
                const appARN: string = await this.getPlatformApplicationARN(body.AppKey);
                let endpointARN = await this.createApplicationEndpoint({
                    PlatformApplicationArn: appARN,
                    DeviceToken: body.Token
                });

                if (endpointARN.EndpointArn != undefined) {
                    body.Endpoint = endpointARN;
                }
                else {
                    throw new Error("Register user device faild");
                }
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

        // if device doesn't exist, create one
        if (userDevices.length === 0) {
            let expirationDateTime = new Date();
            expirationDateTime.setDate(expirationDateTime.getDate() + 30);
            body.ExpirationDateTime = expirationDateTime;
        }

        const device = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).upsert(body);
        if (device) {
            delete device.Endpoint;
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
                            DeviceType: device.DeviceType
                        }
                        const ans = await this.publish(pushNotification);
                        console.log("@@@: ", ans);
                    }
                }
            }
            catch (error) {
                console.log(error);
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
    createApplicationEndpoint(body) {
        const params = {
            PlatformApplicationArn: body.PlatformApplicationArn,
            Token: body.DeviceToken
        };
        return this.sns.createPlatformEndpoint(params).promise();
    }

    // publish to particular topic ARN or to endpoint ARN
    publish(pushNotification) {
        let basePlatform: PlatformBase;

        switch (pushNotification.PlatformType){
            case "iOS":
                basePlatform = new PlatformIOS(this.papiClient);
                break;
            case "Android": 
                basePlatform = new PlatformAndroid(this.papiClient);
                break;
            case "Addon":
                basePlatform = new PlatformAddon(this.papiClient);
                break;
            default:
                throw new Error(`PlatformType not supported ${pushNotification.PlatformType}}`);
        }
        return basePlatform.publish(pushNotification)
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

    // called from client side
    async importNotifications(body) {
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

}

export default NotificationsService;