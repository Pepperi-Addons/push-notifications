
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk'
import { NOTIFICATIONS_TABLE_NAME, USER_DEVICE_TABLE_NAME } from '../shared/entities'
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
    const relationsRes = await createPageBlockRelation(client);
    await service.createPNSSubscription();
    await createRelations(papiClient);

    return {
        success: notificationsResourceRes.success && userDeviceResourceRes.success && relationsRes.success,
        errorMessage: `notificationsResourceRes: ${notificationsResourceRes.errorMessage}, userDeviceResourceRes: ${userDeviceResourceRes.errorMessage}, relationsRes:  ${relationsRes.errorMessage}`
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
        Type: 'meta_data',
        Fields: {
            UserID: {
                Type: 'String'
            },
            DeviceID: {
                Type: 'String'
            },
            DeviceName: {
                Type: 'String'
            },
            DeviceType: {
                Type: 'String'
            },
            AppID: {
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

async function createRelations(papiClient: PapiClient) {
    let relations: Relation[] = [
        //DIMX import
        {
            RelationName: "NotificationsImportResource",
            AddonUUID: "95025423-9096-4a4f-a8cd-d0a17548e42e",
            Name: NOTIFICATIONS_TABLE_NAME,
            Description: "Notifications Import Relation",
            Type: "AddonAPI",
            AddonRelativeURL: "/api/import_notifications_source"
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