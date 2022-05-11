
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk'
import { NOTIFICATIONS_TABLE_NAME, USER_DEVICE_TABLE_NAME, NOTIFICATIONS_VARS_TABLE_NAME, DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION, DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION } from '../shared/entities'
import { Relation } from '@pepperi-addons/papi-sdk'
import NotificationsService from './notifications.service';

export async function install(client: Client, request: Request): Promise<any> {
    const service = new NotificationsService(client)
    const papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client["ActionUUID"]
    });

    const notificationsResourceRes = await createNotificationsResource(papiClient)
    const userDeviceResourceRes = await createUserDeviceResource(papiClient);
    const NotificationsVariablesRes = await createNotificationsVariablesResource(papiClient);
    const relationsRes = await createPageBlockRelation(client);
    await service.createPNSSubscriptionForUserDeviceRemoval();
    await service.createPNSSubscriptionForNotificationInsert();
    await createRelations(papiClient);

    return {
        success: notificationsResourceRes.success && userDeviceResourceRes.success && relationsRes.success && NotificationsVariablesRes.success,
        errorMessage: `notificationsResourceRes: ${notificationsResourceRes.errorMessage}, userDeviceResourceRes: ${userDeviceResourceRes.errorMessage}, relationsRes:  ${relationsRes.errorMessage}, notificationsVarsRes:  ${NotificationsVariablesRes.errorMessage}`
    };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
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
            SubType: "NG11",
            AddonUUID: client.AddonUUID,
            AddonRelativeURL: filename,
            ComponentName: `NotificationBlockComponent`,
            ModuleName: `NotificationBlockModule`,
            EditorComponentName: `NotificationBlockEditorComponent`,
            EditorModuleName: `NotificationBlockEditorModule`
        };

        const service = new NotificationsService(client);
        const result = await service.upsertRelation(pageComponentRelation);
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
            errorMessage: err ? err : 'Unknown Error Occured',
        }
    }
}

async function createUserDeviceResource(papiClient: PapiClient) {
    var userDeviceScheme: AddonDataScheme = {
        Name: USER_DEVICE_TABLE_NAME,
        Type: 'indexed_data',
        Fields: {
            UserUUID: {
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
        }
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
            errorMessage: err ? err : 'Unknown Error Occured',
        }
    }
}

async function createNotificationsVariablesResource(papiClient: PapiClient) {
    var userDeviceScheme: AddonDataScheme = {
        Name: NOTIFICATIONS_VARS_TABLE_NAME,
        Type: 'meta_data',
        Fields: {
            Key: {
                Type: 'String'
            }
        }
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
            errorMessage: err ? err : 'Unknown Error Occured',
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
            errorMessage: err ? err : 'Unknown Error Occured',
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
