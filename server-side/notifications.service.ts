import { PapiClient, User } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import {
    NOTIFICATIONS_TABLE_NAME, USER_DEVICE_TABLE_NAME, PLATFORM_APPLICATION_TABLE_NAME, NOTIFICATIONS_LOGS_TABLE_NAME, NOTIFICATIONS_VARS_TABLE_NAME, notificationOnCreateSchema, notificationOnUpdateSchema, userDeviceSchema, platformApplicationsSchema, platformApplicationsIOSSchema, UserDevice,
    DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION, DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION, NotificationLog, Notification, notificationReadStatus, BulkMessageObject, UsersGroup, DefaultNotificationsSlug, DefaultNotificationsPage
} from 'shared'
import { Validator } from 'jsonschema';
import { v4 as uuid } from 'uuid';
import jwt from 'jwt-decode';
import split from 'just-split';

// import { Agent } from 'https';
// import fetch from 'node-fetch';
import {NotifiactionsSnsService} from './notifications-sns.service'
import { UserDeviceHandlingFactory } from './register-device.service'
import * as encryption from 'shared'
import { PayloadData } from 'shared'
import UsersListsService from './users-list.service';
const NOTIFICATIONS_SEND_TO_COUNT_SOFT_LIMIT = 500
abstract class PlatformBase {
    protected notificationsSnsService: NotifiactionsSnsService
    constructor(protected papiClient) {
            this.notificationsSnsService = new NotifiactionsSnsService(this.papiClient)
    }

    abstract createPlatformApplication(body: any): any;
    abstract publish(pushNotification: any, numberOfUnreadNotifications: number): any;
}
class PlatformIOS extends PlatformBase {
    async createPlatformApplication(body) {
        const params = {
            Name: body.AppKey,
            Platform: "APNS",
            Attributes: {
                'PlatformCredential': body.Credential, // .p8
                'PlatformPrincipal': body.AppleSigningKeyID,
                'ApplePlatformTeamID': body.AppleTeamID,
                'ApplePlatformBundleID': body.AppKey
            }
        };
        return await this.notificationsSnsService.createPlatformApplication(params);
    }

    createPayload(data, numberOfUnreadNotifications) {
        const jsonData = JSON.stringify({ Notification: data.Notification})
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
        return this.notificationsSnsService.publishPushNotifiaction(params);
    }
}
class PlatformAndroid extends PlatformBase {
    async createPlatformApplication(body) {
        const params = {
            Name: body.AppKey,
            Platform: "GCM",
            Attributes: {
                'PlatformCredential': body.Credential, // API Key
            }
        };
        return await this.notificationsSnsService.createPlatformApplication(params);
    }

    createPayload(data, numberOfUnreadNotifications) {
        console.log("@@@Android payload data", data)
        const id = NotificationsService.hashCode(data.Notification.Key)
        const jsonData = JSON.stringify({ Notification: data.Notification})
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

    publish(pushNotification: any, numberOfUnreadNotifications: number): any {
        const payload = this.createPayload(pushNotification, numberOfUnreadNotifications);
        const params = {
            Message: JSON.stringify(payload),
            MessageStructure: 'json',
            TargetArn: pushNotification.Endpoint
        };
        console.log("@@@params: ", params);
        return this.notificationsSnsService.publishPushNotifiaction(params);
    }
}
class PlatformAddon extends PlatformBase {
    createPlatformApplication(body: any): any {
        throw new Error("Not implemented");
    }

    publish(pushNotification: any, numberOfUnreadNotifications: number): any {
        console.log("@@@pushNotifications inside Addon before publish: ", pushNotification);
        return this.papiClient.post(pushNotification.Endpoint, pushNotification).then(console.log("@@@pushNotifications inside Addon after publish: ", pushNotification));
    }
}
class NotificationsService {
    papiClient: PapiClient
    addonSecretKey: string
    addonUUID: string;
    accessToken: string;
    currentUserUUID: string;
    users: Promise<any>;
    notificationsSnsService: NotifiactionsSnsService

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
        this.users= this.papiClient.users.find();

        // get user uuid from the token
        const parsedToken: any = jwt(this.accessToken)
        this.currentUserUUID = parsedToken.sub;
        this.notificationsSnsService = new NotifiactionsSnsService(this.client)
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

    async getEmailByUserUUID(userUUID: string): Promise<string>{
        const userData = await this.papiClient.resources.resource('users').key(userUUID).get();
        if (userData.Email !== undefined){
            return userData.Email
        }
        else {
            throw new Error(`User with UUID ${userUUID} do not have email!`)
        }
    }

    async getUserUUIDByEmail(userEmail) {
        const userUUID = (await this.users).find(u => u.Email?.toLowerCase() === userEmail.toLowerCase())?.UUID
        if (userUUID !== undefined) {
            return userUUID;
        }
        else {
            throw new Error(`User with Email: ${userEmail} does not exist`);
        }
    }

    async getUserName(userUUID: string) {
        const user: User = await this.papiClient.users.uuid(userUUID).get();
        console.log(`got user - ${JSON.stringify(user)}`)
        if (user !== undefined) {
            return `${user.FirstName ?? "" } ${ user.LastName ?? ""}`
        }
    }

    // get all notifications for the current user
    async unreadNotificationsCount() {
        return await this.getNumberOfUnreadNotifications(this.currentUserUUID);
    }

    async getNumberOfUnreadNotifications(userUUID: string) {
        const notifications = await this.getNotifications({ where: `Read=${false} And UserUUID='${userUUID}'`});
        console.log(`number of unread notifications - ${notifications.length} for user - ${userUUID}`)
        return notifications.length;
    }

    public static hashCode(str) {
        let hash = 0, i, chr;
        if (str.length === 0) { return hash; }
        for (i = 0; i < str.length; i++) {
          chr = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + chr;
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
        if (body.Key !== undefined) {
            return await this.updateNotification(body);
        }
        else {
            return this.createNotification(body);
        }
    }

    // create a single notification
    async createNotification(body) {
        const validation = this.validateSchema(body, notificationOnCreateSchema);
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
            body.CreatorName = await this.getUserName(this.currentUserUUID);
            body.Read = false;
            body.ExpirationDateTime = this.getExpirationDateTime(lifetimeSoftLimit[DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.key]);
            body.Source = 'API'
            return this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).upsert(body);
        }
        else {
            const errors = validation.errors.map(error => {
                if (error.name === 'oneOf') {
                    return error.message = `Exactly one of the following properties is required: ${ error.argument}`;
                }
                else {
                    return error.stack.replace("instance.", "");
                }
            });
            throw new Error(errors.join("\n"));
        }
    }

    async updateNotification(body) {
        const validation = this.validateSchema(body, notificationOnUpdateSchema);
        if (validation.valid) {
            const notifications = await this.getNotifications({ where: `Key='${body.Key}'` })
            const notification = notifications.length > 0 ? notifications[0] : undefined
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
                    return error.message = `One of the following properties is required: ${ error.argument}`;
                }
                else {
                    return error.stack.replace("instance.", "");
                }
            });
            throw new Error(errors.join("\n"));
        }
    }

    async updateNotificationReadStatus(body){
        const notification: Notification = {
            "Key": body.Key,
            "Read": body.Read,
        }
        return await this.updateNotification(notification)
    }

    async updateNotificationsReadStatus(body: notificationReadStatus) {
        const notifications: Notification[] = [];
        for (const key of body.Keys) {
            const notification: Notification = {
                "Key": key,
                "Read": body.Read
            }
            notifications.push(notification);
        }
        // To update read status and upload to PFS use function
        // return await this.uploadFileAndImport(notifications);
        return await this.batchUpsertReadStatusToAdal(notifications);
    }

    //MARK: UserDevice handling

    async getUserDevices(query) {
        const userDevices = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).iter(query).toArray();
        return userDevices.map(device => {
            delete device.Token
            return device;
        });
    }

    async populateUserDevice(deviceDataToPopulate){

        deviceDataToPopulate.UserUUID = this.currentUserUUID;
        deviceDataToPopulate.Username = await this.getEmailByUserUUID(this.currentUserUUID)
        deviceDataToPopulate.Key = `${deviceDataToPopulate.DeviceKey}_${deviceDataToPopulate.AppKey}`;
        deviceDataToPopulate.LastRegistrationDate = new Date().toISOString();

        //Entries in the token details on the server are considered valid in case they were updated in the last 30 days
        deviceDataToPopulate.ExpirationDateTime = this.getExpirationDateTime(30);
        console.log('Setting Expiration Time To ', deviceDataToPopulate.ExpirationDateTime)


        return deviceDataToPopulate
    }

    private getExpirationDateTime(days: number) {
        const daysToAdd = days * 24 * 60 * 60 * 1000 // ms * 1000 => sec. sec * 60 => min. min * 60 => hr. hr * 24 => day.
        return new Date(Date.now() + daysToAdd)
    }

    async upsertUserDevice(body: UserDevice) { // body -> userDevice
        // Schema validation
        console.log(`about to upsert user device: ${JSON.stringify(body)}`)
        const validation = this.validateSchema(body, userDeviceSchema);
        if (validation.valid) {
            let deviceData = await this.populateUserDevice(body)

            const userDeviceHandlingFactory = new UserDeviceHandlingFactory(this.client, deviceData)

            const strategy = await userDeviceHandlingFactory.getStrategy()

            deviceData = await strategy.execute(deviceData)
            deviceData.Token = await encryption.encryptSecretKey(deviceData.Token, this.client.AddonSecretKey ?? "")

            console.log('Upserting user device to ADAL ', deviceData)
            return await this.upsertUserDeviceResource(deviceData);
        }
        else {
            this.throwErrorFromSchema(validation);
        }
    }

    async upsertUserDeviceResource(body) {
        const device = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).upsert(body);
        if (device) {
            delete device.Endpoint;
            delete device.Token;
            return device;
        }
    }
    // remove devices from ADAL by deviceKey , it will remove from AWS in ExpirationDateTime
    async removeDevices(body) {
        await Promise.all(
            body.DevicesKeys.map(async device => {
                try {
                    console.log('Removing device from Adal, with Key ', device)
                    const deviceToRemove = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).get(device);
                    deviceToRemove.Hidden = true;
                    await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).upsert(deviceToRemove);
                }
                catch (error) {
                    console.log('error while removing device', error.message);
                }
            })
        )
    }
    // called by PNS when a notification is created
    async sendPushNotification(body) {
        console.log("@@@pushNotification body: ", body);
        await Promise.all(body.Message.ModifiedObjects.map(async object => {
            try {
                console.log("@@@pushNotification object: ", object);
                const notification = await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_TABLE_NAME).key(object.ObjectKey).get() as Notification;
                //get user devices by user uuid
                const userDevicesList: UserDevice[] = await this.getUserDevicesByUserUUID(notification.UserUUID) as any;
                console.log("@@@pushNotification userDevicesList: ", userDevicesList);
                if (userDevicesList !== undefined) {
                    // for each user device send push notification
                    await Promise.all(userDevicesList.map(async(device) => {
                        try {
                            const pushNotification: PayloadData = {
                                Notification: notification,
                                Endpoint: device.Endpoint,
                                DeviceType: device.DeviceType,
                                PlatformType: device.PlatformType
                            }
                            console.log("@@@pushNotification: ", pushNotification);
                            const ans = await this.publish(pushNotification);
                            console.log("@@@ans from publish: ", ans);
                        }
                        catch (error) {
                            console.warn(`@@@error single publish failed with error:${error} for device: ${JSON.stringify(device)} and notification: ${JSON.stringify(notification)}`);
                        }
                    }));
                }
            }
            catch (error) {
                console.log("@@@error", error);
            }
        }))
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
        if (body.Key !== undefined) {
            return await this.updatePlatformApplication(body);
        }
        else {
            return await this.createPlatformApplication(body);
        }
    }

    async updatePlatformApplication(body) {
        const application = await this.getPlatformApplication({ where: `Key='${body.Key}'` });
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
        const validation = this.validateSchema(body, platformApplicationsSchema);
        if (validation.valid) {
            // dist can have only one iOS & one Android platform
            const applications = await this.getPlatformApplication({ where: `Type='${body.Type}'` });
            if (applications.length > 0) {
                const error: any = new Error(`Platform for '${body.Type}' already exists`);
                error.code = 403;
                throw error;
            }

            let basePlatform: PlatformBase;

            switch (body.Type) {
                case "iOS":
                    const validation = this.validateSchema(body, platformApplicationsIOSSchema);
                    if (validation.valid) {
                        basePlatform = new PlatformIOS(this.papiClient);
                        break;
                    }
                    else {
                        this.throwErrorFromSchema(validation);
                    }
                case "Android":
                    basePlatform = new PlatformAndroid(this.papiClient);
                    break;
                case "Addon":
                    basePlatform = new PlatformAddon(this.papiClient);
                    break;
                default:
                    throw new Error(`Type not supported ${body.PlatformType}}`);
            }

            const application = await basePlatform.createPlatformApplication(body)

            if (application.PlatformApplicationArn !== undefined) {
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

    async deleteAllApplicationEndpoints() {
        const devices = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).iter().toArray();

        await Promise.all(devices.map(async device => {
            await this.notificationsSnsService.deleteApplicationEndpoint(device.Endpoint);
        }))
    }

    async deleteAllPlatformsApplication() {
        const platforms = await this.papiClient.addons.data.uuid(this.addonUUID).table(PLATFORM_APPLICATION_TABLE_NAME).iter().toArray();

        await Promise.all(platforms.map(async platform => {
            await this.notificationsSnsService.deleteApplication(platform.ApplicationARN);
        }))
    }

    // publish to particular topic ARN or to endpoint ARN
    async publish(pushNotification: PayloadData) {
        let basePlatform: PlatformBase;

        switch (pushNotification.PlatformType) {
            case "iOS":
                basePlatform = new PlatformIOS(this.papiClient);
                break;
            case "Android":
                basePlatform = new PlatformAndroid(this.papiClient);
                break;
            case "Addon":
                console.log("@@@switchCase addon: ", pushNotification);
                basePlatform = new PlatformAddon(this.papiClient);
                break;
            default:
                throw new Error(`PlatformType not supported ${pushNotification.PlatformType}}`);
        }
        const numberOfUnreadNotifications = await this.getNumberOfUnreadNotifications(pushNotification.Notification.UserUUID!);
        return basePlatform.publish(pushNotification, numberOfUnreadNotifications)
    }

    //remove endpoint ARN
    async removeUserDeviceEndpoint(body) {
        await Promise.all(body.Message.ModifiedObjects.map(async object => {
            console.log(`Removing device Endpoint From SNS ${object.Key}`)
            if (object.EndpointARN !== undefined) {
                await this.notificationsSnsService.deleteApplicationEndpoint(object.EndpointARN);
            }
            else {
                console.log("Device endpoint does not exist");
            }
        }))
    }

    async removePlatformApplication(body) {
        await Promise.all(body.Message.ModifiedObjects.map(async object => {
            if (object.EndpointARN !== undefined) {
                await this.notificationsSnsService.deleteApplicationEndpoint(object.ApplicationARN);
            }
            else {
                console.log("Device endpoint does not exist");
            }
        }))
    }

    //DIMX 
    async importNotificationsSource(body) {
        await Promise.all(body.DIMXObjects.map(async dimxObj =>{
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
                            dimxObj.Details = `${JSON.stringify(dimxObj.Object.UserEmail)} failed with the following error: The given Email is not compatible with any UserUUID`
                        }
                    }
                }
                else {
                    dimxObj.Status = Error;
                    dimxObj.Details = `${JSON.stringify(dimxObj.Object)} failed with the following error: USERUUID and UserEmail are mutually exclusive`
                }
            }
        }))
        console.log("@@@@import end body: ", body);
        return body;
    }

    validateRecipientLimit(users: string[], groups: UsersGroup[]) {
        // validating that there are no more than NOTIFICATIONS_SEND_TO_COUNT_SOFT_LIMIT hard coded users and groups
        if (users.length + groups.length> NOTIFICATIONS_SEND_TO_COUNT_SOFT_LIMIT) {
            throw new Error(`Max ${NOTIFICATIONS_SEND_TO_COUNT_SOFT_LIMIT} hard coded users and groups`);
        }

    }

    async handleUsersUUIDsForBulk(bulkNotification: BulkMessageObject): Promise<BulkMessageObject>{
        const usersListsService = new UsersListsService(this.client)

        this.validateRecipientLimit(bulkNotification.UsersUUID || [], bulkNotification.SentTo.Groups || [])

        // if there are groups selected, get all users uuids from the groups
        if (bulkNotification.SentTo?.Groups?.length! > 0){
            const usersFromGroups: string[][] = await Promise.all(bulkNotification.SentTo.Groups!.map(async group => {
                return usersListsService.getUserUUIDsFromGroup(group.ListKey, group.SelectedGroupKey)
            }))
            // merge all of the hard coded users and users from groups
            bulkNotification.UsersUUID = [...bulkNotification.UsersUUID!, ...usersFromGroups.flat()]
        }
        // return only distinct user uuids to prevent duplicates
        bulkNotification.UsersUUID = [...new Set(bulkNotification.UsersUUID)];


        if (bulkNotification.UsersUUID!.length === 0) {
            throw new Error('no users to send notification');
        }
        return bulkNotification
    }

    // create notifications using DIMX
    async bulkNotifications(notificationToSend: BulkMessageObject): Promise<any> {

        notificationToSend = await this.handleUsersUUIDsForBulk(notificationToSend)

        const creatorName = await this.getUserName(this.currentUserUUID)

        if (notificationToSend.UsersUUID !== undefined) {
            const notifications: Notification[] = [];
            for (const userUuid of notificationToSend.UsersUUID) {
                const notification: Notification = {
                    "UserUUID": userUuid,
                    "Title": notificationToSend.Title,
                    "Body": notificationToSend.Body,
                    "CreatorName": creatorName,
                    "Read": notificationToSend.Read ?? false,
                    "Source": "Webapp"
                }
                notifications.push(notification);
            }
            // To create notifications and upload to PFS use function
            // return await this.uploadFileAndImport(notifications);
            return await this.handleBulkChunkUpload(notifications, notificationToSend)
        }
    }

    // splitting notifications to chunks of 500 notifications due to DIMX and ADAL limitations,
    // uploading the notifications and after finishing uploading log of the notifications
    async handleBulkChunkUpload(notifications: Notification[], notificationToSend: BulkMessageObject){
        const splitToChunks: Notification[][] = split(notifications, 500)
        const chunkRes = await Promise.all(splitToChunks.map(async chunk => {
            const res = await this.uploadNotificationsToDIMX(chunk)
            return res
        }))
        
        let ans = await this.upsertNotificationLog(notificationToSend);
        console.log('ans from upload notifications log', ans);
        return chunkRes
    }

    async batchUpsertReadStatusToAdal(notificationsToUpdate: Notification[]){
        const url = `/addons/data/batch/${this.addonUUID}/${NOTIFICATIONS_TABLE_NAME}`
        return await this.papiClient.post(url, { Objects: notificationsToUpdate});
    }

    // Create Notifications only using DIMX, without PFS
    async uploadNotificationsToDIMX(body) : Promise<any>{
        const url = `/addons/data/import/${this.addonUUID}/${NOTIFICATIONS_TABLE_NAME}`
        const ansFromImport = await this.papiClient.post(url, {Objects: body});
        return ansFromImport
    }
    // we are currently not using this functions, however when we will use PFS & ADAL instead of DIMX we will use this functions

    // async uploadFileAndImport(body) {
    //     let fileURL = await this.uploadObject();
    //     //upload Object To S3
    //     await this.apiCall('PUT', fileURL.PresignedURL, body).then((res) => res.text());
    //     if (fileURL != undefined && fileURL.URL != undefined) {
    //         const file = {
    //             'URI': fileURL.URL,
    //             'OverwriteObject': false,
    //             'Delimiter': ';',
    //             "Version": "1.0.3"
    //         }
    //         const url = `/addons/data/import/file/${this.addonUUID}/${NOTIFICATIONS_TABLE_NAME}`
    //         const ansFromImport = await this.papiClient.post(url, file);
    //         const ansFromAuditLog = await this.pollExecution(this.papiClient, ansFromImport.ExecutionUUID);
    //         if (ansFromAuditLog.success === true) {
    //             const downloadURL = JSON.parse(ansFromAuditLog.resultObject).URI;
    //             return await this.DownloadResultArray(downloadURL);
    //         }
    //         return ansFromAuditLog;
    //     }
    // }

    // async DownloadResultArray(downloadURL): Promise<any[]> {
    //     console.log(`OutputArrayObject: Downloading file`);
    //     try {
    //         const response = await fetch(downloadURL);
    //         const data: string = await response.text();
    //         const DIMXObjectArr: any[] = JSON.parse(data);
    //         return DIMXObjectArr;
    //     }
    //     catch (ex) {
    //         console.log(`DownloadResultArray: ${ex}`);
    //         throw new Error((ex as { message: string }).message);
    //     }
    // }

    // async uploadObject() {
    //     const url = `/addons/pfs/${this.addonUUID}/${PFS_TABLE_NAME}`
    //     let expirationDateTime = new Date();
    //     expirationDateTime.setDate(expirationDateTime.getDate() + 1);
    //     const body = {
    //         "Key": "/tempBulkAPI/" + uuid() + ".json",
    //         "MIME": "application/json",
    //         "ExpirationDateTime": expirationDateTime
    //     }
    //     return await this.papiClient.post(url, body);
    // }

    // async apiCall(method: HttpMethod, url: string, body: any = undefined) {

    //     const agent = new Agent({
    //         rejectUnauthorized: false,
    //     })

    //     const options: any = {
    //         method: method,
    //         agent: agent,
    //         headers: { 'Content-Type': 'application/json' }
    //     };

    //     if (body) {
    //         options.body = JSON.stringify(body);
    //     }

    //     const res = await fetch(url, options);


    //     if (!res.ok) {
    //         // try parsing error as json
    //         let error = '';
    //         try {
    //             error = JSON.stringify(await res.json());
    //         } catch { }

    //         throw new Error(`${url} failed with status: ${res.status} - ${res.statusText} error: ${error}`);
    //     }
    //     return res;
    // }


    // async pollExecution(papiClient: PapiClient, ExecutionUUID: string, interval = 1000, maxAttempts = 60, validate = (res) => {
    //     return res != null && (res.Status.Name === 'Failure' || res.Status.Name === 'Success');
    // }) {
    //     let attempts = 0;

    //     const executePoll = async (resolve, reject) => {
    //         const result = await papiClient.get(`/audit_logs/${ExecutionUUID}`);
    //         attempts++;

    //         if (validate(result)) {
    //             return resolve({ "success": result.Status.Name === 'Success', "errorCode": 0, 'resultObject': result.AuditInfo.ResultObject });
    //         }
    //         else if (maxAttempts && attempts === maxAttempts) {
    //             return resolve({ "success": false, "errorCode": 1 });
    //         }
    //         else {
    //             setTimeout(executePoll, interval, resolve, reject);
    //         }
    //     };

    //     return new Promise<any>(executePoll);
    // }

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
            const nanVariableName = isNaN(notificationsNumberLimitation) ? DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION.key : DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.key;
            throw new Error(`${nanVariableName} is not a number.`);
        }
    }

    // Usage monitor

    async getTotalNotificationsSentPerDay() {
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
        const daysToSubtract = 7 * 24 * 60 * 60 * 1000 // ms * 1000 => sec. sec * 60 => min. min * 60 => hr. hr * 24 => day.
        const firstDate = new Date(Date.now() - daysToSubtract)

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
    async getTotalMessagesSentInTheLastWeekUsageData() {
        const daysToSubtract = 7 * 24 * 60 * 60 * 1000 // ms * 1000 => sec. sec * 60 => min. min * 60 => hr. hr * 24 => day.
        const firstDate = new Date(Date.now() - daysToSubtract)

        const totalMessages = await this.getNotifications({ where: `CreationDateTime>'${firstDate}' And Source='Webapp'` });
        return {
            Title: "Usage",
            "Resources": [
                {
                    "Data": "Total Messages",
                    "Description": "Total Messages Sent in The Last 7 Days",
                    "Size": totalMessages.length
                },
            ],
            "ReportingPeriod": "Weekly",
            "AggregationFunction": "LAST"
        }
    }

    // Notifications Log
    async getNotificationsLog(): Promise<NotificationLog[]> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_LOGS_TABLE_NAME).iter({ where: `CreatorUUID='${this.currentUserUUID}'` }).toArray() as NotificationLog[];
    }

    async getNotificationsLogByKey(logKey: string): Promise<NotificationLog> {
        if (logKey === undefined){
            throw new Error('Log Key is undefined')
        }
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(NOTIFICATIONS_LOGS_TABLE_NAME).key(logKey).get() as NotificationLog;
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

        const notificationLog: NotificationLog = {
            'CreatorUUID': this.currentUserUUID,
            'SentTo': body.SentTo,
            'Title': body.Title,
            'Body': body.Body,
            // when migration from 1.1 to 1.2 we are changing data in notifications log,
            // so we need to check if the notification log already has a key to update the proper record
            'Key': body.Key || uuid()

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

    // create notifications slug if not exists already
    async createNotificationsSlug(){
        const slugsUrl = `/addons/api/4ba5d6f9-6642-4817-af67-c79b68c96977/api/slugs`
        const slugBody = DefaultNotificationsSlug
        const existingSlugs = await this.papiClient.get(slugsUrl)
        if(!existingSlugs.find(slug => slug.Slug === slugBody.slug.Slug)){
            await this.papiClient.post(slugsUrl, slugBody)
        }
    }

    // create notifications page if not exists already
    async createNotificationsPage(){
        const pages = await this.papiClient.pages.iter().toArray()
        const pageBody = DefaultNotificationsPage
        if(!pages.find(page => page.Blocks[0].Key === pageBody.Blocks[0].Key)){
            await this.papiClient.pages.upsert(pageBody)
        }
    }

}

export default NotificationsService;
