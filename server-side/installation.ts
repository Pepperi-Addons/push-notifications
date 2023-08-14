
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, error Message:{the reason why it is false}}
The error Message is important! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk'
import { NOTIFICATIONS_TABLE_NAME, USER_DEVICE_TABLE_NAME, PLATFORM_APPLICATION_TABLE_NAME, NOTIFICATIONS_VARS_TABLE_NAME, PFS_TABLE_NAME, NOTIFICATIONS_LOGS_TABLE_NAME, DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION, DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION } from 'shared'
import { Relation } from '@pepperi-addons/papi-sdk'
import NotificationsService from './notifications.service';
import UsersListsService from './users-list.service'
import { NOTIFICATION_SETUP_ELEMENT } from 'shared';
import semver from 'semver';

export async function install(client: Client, request: Request): Promise<any> {
    const service = new NotificationsService(client)
    const usersListsService = new UsersListsService(client)
    const papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client["ActionUUID"]
    });

    const notificationsResourceRes = await createNotificationsResource(papiClient)
    const notificationsLogViewRes = await createNotificationsLogViewResource(papiClient);
    const userDeviceResourceRes = await createUserDeviceResource(papiClient);
    const notificationsVariablesRes = await createNotificationsVariablesResource(papiClient, client);
    const platformApplicationResourceRes = await createPlatformApplicationResource(papiClient);
    const pfsResourceRes = await createPFSResource(papiClient);
    const relationsRes = await createPageBlockRelation(client);
    const settingsRelationsRes = await createSettingsRelation(client);
    const notificationsUsersListsRes = await usersListsService.createUsersListsResource(papiClient);
    const defaultListRes = await usersListsService.createDefaultLists()
    
    await service.createPNSSubscriptionForUserDeviceRemoval();
    await service.createPNSSubscriptionForNotificationInsert();
    await service.createPNSSubscriptionForPlatformApplicationRemoval();
    await createRelations(papiClient);

    return {
        success: notificationsResourceRes.success &&
        defaultListRes.success && 
        userDeviceResourceRes.success && 
        relationsRes.success && 
        settingsRelationsRes.success && 
        notificationsVariablesRes.success && 
        notificationsLogViewRes.success && 
        platformApplicationResourceRes.success && 
        pfsResourceRes.success && 
        notificationsUsersListsRes.success,
        errorMessage: `notificationsResourceRes: ${notificationsResourceRes.errorMessage}, 
        defaultListRes: ${defaultListRes.errorMessage}, 
        notificationsLogViewRes: ${notificationsLogViewRes}, 
        userDeviceResourceRes: ${userDeviceResourceRes.errorMessage},
        relationsRes: ${relationsRes.errorMessage}, 
        settingsRelationsRes: ${settingsRelationsRes.errorMessage}, 
        notificationsVarsRes:  ${notificationsVariablesRes.errorMessage},
        platformApplicationResourceRes: ${platformApplicationResourceRes.errorMessage}, 
        pfsResourceRes: ${pfsResourceRes.errorMessage}, 
        notificationsUsersListsRes: ${notificationsUsersListsRes.errorMessage}`
    };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    const papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client["ActionUUID"]
    });
    // need authorization to perform SNS actions that only the push-notifications lambda has
    try {
        await papiClient.addons.api.uuid(client.AddonUUID).file('api').func('delete_all_application_endpoints').post();
        await papiClient.addons.api.uuid(client.AddonUUID).file('api').func('delete_all_platforms').post();
        return { success: true, resultObject: {} }
    }
    catch (error){
        console.log(error);
        return { success: true, resultObject: {} }
    }
}

export async function upgrade(client: Client, request: Request): Promise<any> {

    const relationsRes = await createPageBlockRelation(client);
    const settingsRelationsRes = await createSettingsRelation(client);

    // Creating new scheme of users lists only if the current version is older than 1.2.0
    if(request.body.FromVersion && semver.compare(request.body.FromVersion, '1.2.0')! < 0){
        const papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client["ActionUUID"]
        });
        // recreate the notifications log view scheme due to migration from UsersList to SentTo
        const notificationsLogViewRes = await createNotificationsLogViewResource(papiClient);
        const migrateUpLogRes = await migrateUpNotificationsLog(client)
        const usersListsService = new UsersListsService(client)
        const notificationsUsersListsRes = await usersListsService.createUsersListsResource(papiClient);
        const defaultListRes = await usersListsService.createDefaultLists()
        const userDeviceResourceRes = await createUserDeviceResource(papiClient);
        return { success: notificationsUsersListsRes.success && 
            migrateUpLogRes.success && 
            defaultListRes.success && 
            notificationsLogViewRes.success && 
            relationsRes.success && 
            settingsRelationsRes.success && 
            userDeviceResourceRes.success, 
            resultObject: {} }
    }
    else{
        return {success: relationsRes.success && settingsRelationsRes.success, resultObject: {} }
    }
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    if(request.body.FromVersion && semver.compare(request.body.FromVersion, '1.2.0')! > 0){
        // reverting back to UsersList from SentTo
        await migrateDownNotificationsLog(client)
    }
    return { success: true, resultObject: {} }
}

async function migrateUpNotificationsLog(client: Client){
    try{
        const service = new NotificationsService(client)
        let logs = await service.getNotificationsLog()
        logs.forEach(async (log) => {
            log.SentTo = {Users: log.UsersList};
            delete log.UsersList
            await service.upsertNotificationLog(log);
        })
        return { success: true, resultObject: '' };
    } 
    catch (err) {
        return { success: false, errorMessage: err ? err : 'Unknown Error Occurred' };
    }
}


async function migrateDownNotificationsLog(client: Client){
    try{
        const service = new NotificationsService(client)
        let logs = await service.getNotificationsLog()
        logs.forEach(async (log) => {
            log.UsersList = log.SentTo.Users
            await service.upsertNotificationLog(log);
        })
        return { success: true, resultObject: '' };
    } 
    catch (err) {
        return { success: false, errorMessage: err ? err : 'Unknown Error Occurred' };
    }
}

async function createPageBlockRelation(client: Client): Promise<any> {
    try {
        const blockName = 'Notifications';
        const filename = 'notifications';

        const pageComponentRelation: Relation = {
            RelationName: "PageBlock",
            Name: blockName,
            Description: `${blockName} block`,
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: client.AddonUUID,
            AddonRelativeURL: filename,
            ComponentName: `NotificationBlockComponent`,
            ModuleName: `NotificationBlockModule`,
            EditorComponentName: `NotificationBlockEditorComponent`,
            EditorModuleName: `NotificationBlockEditorModule`,
            ElementsModule: 'WebComponents',
            ElementName: `notifications-element-${client.AddonUUID}`,
            EditorElementName: `notifications-editor-element-${client.AddonUUID}`,
        };

        const service = new NotificationsService(client);
        const result = await service.upsertRelation(pageComponentRelation);
        return { success: true, resultObject: result };
    } catch (err) {
        return { success: false, resultObject: err, errorMessage: `Error in upsert relation. error - ${err}` };
    }
}

async function createSettingsRelation(client: Client): Promise<any> {
    try {
        const service = new NotificationsService(client);
        
        const filename = 'notifications';

        let settingsBlockRelation: Relation = {
            RelationName: "SettingsBlock",
            GroupName: 'Push Notifications',
            SlugName: 'device_managment',
            Name: 'DeviceManagment',
            Description: 'Device Managment',
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: client.AddonUUID,
            AddonRelativeURL: filename,
            ComponentName: `DeviceManagmentComponent`,
            ModuleName: `DeviceManagmentModule`,
            ElementsModule: 'WebComponents',
            ElementName: `device-managment-element-${client.AddonUUID}`,
        };

        let result = await service.upsertRelation(settingsBlockRelation);

        settingsBlockRelation = {
            RelationName: "SettingsBlock",
            GroupName: 'Push Notifications',
            SlugName: 'notifications_log',
            Name: 'NotificationsLog',
            Description: 'Notifications Log',
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: client.AddonUUID,
            AddonRelativeURL: filename,
            ComponentName: `NotificationsLogComponent`,
            ModuleName: `NotificationsLogModule`,
            ElementsModule: 'WebComponents',
            ElementName: `notifications-log-element-${client.AddonUUID}`,
        };

        result = await service.upsertRelation(settingsBlockRelation);

        settingsBlockRelation = {
            RelationName: "SettingsBlock",
            GroupName: 'Notifications Setup',
            SlugName: 'notifications_setup',
            Name: 'NotificationsSetup',
            Description: 'Notifications Setup',
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: client.AddonUUID,
            AddonRelativeURL: filename,
            ComponentName: `NotificationsSetupComponent`,
            ModuleName: `NotificationsSetupModule`,
            ElementsModule: 'WebComponents',
            ElementName: NOTIFICATION_SETUP_ELEMENT,
        };
        
        result = await service.upsertRelation(settingsBlockRelation);


        return { success: true, resultObject: result };
    } catch (err) {
        return { success: false, resultObject: err, errorMessage: `Error in upsert relation. error - ${err}` };
    }
}

async function createNotificationsResource(papiClient: PapiClient) {
    var notificationsScheme: AddonDataScheme = {
        Name: NOTIFICATIONS_TABLE_NAME,
        Type: 'meta_data',
        Fields: {
            UserUUID: {
                Type: 'String'
            },
            CreatorUUID: {
                Type: 'String'
            },
            Title: {
                Type: 'String'
            },
            Body: {
                Type: 'String'
            },
            Read: {
                Type: 'Bool'
            },
            NavigationPath: {
                Type: 'String'
            }
        }
    };

    try {
        await papiClient.addons.data.schemes.post(notificationsScheme);

        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: err ? err : 'Unknown Error Occurred',
        }
    }
}

async function createPlatformApplicationResource(papiClient:PapiClient) {
    var notificationsScheme: AddonDataScheme = {
        Name: PLATFORM_APPLICATION_TABLE_NAME,
        Type: 'meta_data',
        Fields: {
            ApplicationARN: {
                Type: 'String'
            },
            Type: {
                Type: 'String'
            }
        }
    };

    try {
        await papiClient.addons.data.schemes.post(notificationsScheme);

        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: err ? err : 'Unknown Error Occurred',
        }
    }
}

//save a list of notifications sent by users
async function createNotificationsLogViewResource(papiClient: PapiClient) {
    var notificationsScheme: AddonDataScheme = {
        Name: NOTIFICATIONS_LOGS_TABLE_NAME,
        Type: 'meta_data',
        Fields: {
            CreatorUUID: {
                Type: 'String'
            },
            SentTo: {
                Type: 'Object'
            },
            Title: {
                Type: 'String',
            },
            Body: {
                Type: 'String'
            } 
        }
    };

    try {
        await papiClient.addons.data.schemes.post(notificationsScheme);

        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: err ? err : 'Unknown Error Occurred',
        }
    }
}

async function createUserDeviceResource(papiClient: PapiClient) {
    var userDeviceScheme: AddonDataScheme = {
        Name: USER_DEVICE_TABLE_NAME,
        Type: 'indexed_data',
        Fields: {
            UserUUID: {
                Type: 'String',
                Indexed: true
            },
            Username: {
                Type: 'String'
            },

            DeviceKey: {
                Type: 'String'
            },
            DeviceName: {
                Type: 'String'
            },
            DeviceType: {
                Type: 'String'
            },
            AppKey: {
                Type: 'String'
            },
            AppName: {
                Type: 'String'
            },
            Token: {
                Type: 'String'
            },
            Endpoint: {
                Type: 'Array'
            }
        } as any
    };

    try {
        await papiClient.addons.data.schemes.post(userDeviceScheme);

        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: err ? err : 'Unknown Error Occurred',
        }
    }
}

async function createNotificationsVariablesResource(papiClient: PapiClient, client) {
    var variablesScheme: AddonDataScheme = {
        Name: NOTIFICATIONS_VARS_TABLE_NAME,
        Type: 'meta_data',
        Fields: {
            Key: {
                Type: 'String'
            }
        }
    };

    try {
        await papiClient.addons.data.schemes.post(variablesScheme);
        // Declare default.
        let notificationsVars = { Key: NOTIFICATIONS_VARS_TABLE_NAME };
        notificationsVars[DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION.key] = DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION.softValue;
        notificationsVars[DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.key] = DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.softValue;
        await papiClient.addons.data.uuid(client.AddonUUID).table(NOTIFICATIONS_VARS_TABLE_NAME).upsert(notificationsVars);

        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: err ? err : 'Unknown Error Occurred',
        }
    }
}

// PFS Scheme
async function createPFSResource(papiClient: PapiClient) {
    var pfsScheme : AddonDataScheme = {
        "Name": PFS_TABLE_NAME,
        "Type": 'pfs'
    }

    try {
        await papiClient.addons.data.schemes.post(pfsScheme);

        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: err ? err : 'Unknown Error Occurred',
        }
    }
}

async function createRelations(papiClient: PapiClient) {
    let relations: Relation[] = [
        //DIMX import
        {
            RelationName: "DataImportResource",
            AddonUUID: "95025423-9096-4a4f-a8cd-d0a17548e42e",
            Name: NOTIFICATIONS_TABLE_NAME,
            Description: "Notifications Import Relation",
            Type: "AddonAPI",
            AddonRelativeURL: "/api/import_notifications_source"
        },
        // soft limit
        {
            RelationName: "VarSettings",
            AddonUUID: "95025423-9096-4a4f-a8cd-d0a17548e42e", 
            Name: "Notifications_Soft_Limit",
            Description: "Notifications relation to Var Settings, Var users can edit soft limit via the Var addon",
            Type: "AddonAPI",
            AddonRelativeURL: "/api/notifications_soft_limt",
                                                                        
            Title: "Notifications Soft Limit",
            DataView: notificatiosDataView
        },
        // usage monitor
        {
            RelationName: "UsageMonitor",
            AddonUUID: "95025423-9096-4a4f-a8cd-d0a17548e42e",
            Name: "DailyNotificationsUsageMonitor",
            Description: 'relation for "usage" tab in usage monitor to display number of daily notifications count',
            Type: "AddonAPI",
            AddonRelativeURL: "/api/total_daily_notifications"
        },
        {
            RelationName: "UsageMonitor",
            AddonUUID: "95025423-9096-4a4f-a8cd-d0a17548e42e",
            Name: "WeeklyNotificationsUsageMonitor",
            Description: 'relation for "usage" tab in usage monitor to display total notifications sent in the last 7 days',
            Type: "AddonAPI",
            AddonRelativeURL: "/api/total_notifications_in_last_week"
        }
    ]
    try {
        relations.forEach(async (singleRelation) => {
            await papiClient.post('/addons/data/relations', singleRelation);
        });
        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: err ? err : 'Unknown Error Occurred',
        }
    }
}

const NotificationsFields: any[] = [
    {
        FieldID: 'GeneralInformation',
        Type: 'Separator',
        Title: 'Notifications',
        Mandatory: false,
        ReadOnly: false,
        Layout: {
            Origin: {
                X: 0,
                Y: 0
            },
            Size: {
                Width: 2,
                Height: 0
            }
        },
        Style: {
            Alignment: {
                Horizontal: 'Stretch',
                Vertical: 'Stretch'
            }
        }
    },
    {
        FieldID: DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION.key,
        Type: 'NumberInteger',
        Title: 'Max number of notifications',
        Mandatory: true,
        ReadOnly: false,
        Layout: {
            Origin: {
                X: 0,
                Y: 1
            },
            Size: {
                Width: 1,
                Height: 0
            }
        },
        Style: {
            Alignment: {
                Horizontal: 'Stretch',
                Vertical: 'Stretch'
            }
        }
    },
    {
        FieldID: DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION.key,
        Type: 'NumberInteger',
        Title: 'Notification Life Time Limit',
        Mandatory: true,
        ReadOnly: false,
        Layout: {
            Origin: {
                X: 1,
                Y: 1
            },
            Size: {
                Width: 1,
                Height: 0
            }
        },
        Style: {
            Alignment: {
                Horizontal: 'Stretch',
                Vertical: 'Stretch'
            }
        }
    }
]

const notificatiosDataView = {
    UID: 'ABCD-DCBA-FGHD-POLK',
    Type: 'Form',
    Hidden: false,
    Columns: [{}],
    Context: {
        Object: {
            Resource: "None",
            InternalID: 1,
        },
        Name: 'Notifications data view',
        ScreenSize: 'Tablet',
        Profile: {
            InternalID: 1,
            Name: 'MyProfile'
        }
    },
    Fields: NotificationsFields,
    Rows: []
};
