
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk'
import {NOTIFICATIONS_TABLE_NAME} from '../shared/entities'
import { Relation } from '@pepperi-addons/papi-sdk'
import NotificationsService from './notifications.service';

export async function install(client: Client, request: Request): Promise<any> {
    const papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client["ActionUUID"]
    }); 

    const resourceRes = await createNotificationsResource(papiClient)
     const relationsRes = await createPageBlockRelation(client);

     return {
        success: resourceRes.success && relationsRes.success,
        errorMessage: `adalRes: ${resourceRes.errorMessage}, relationsRes:  ${relationsRes.errorMessage}`
    };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    const papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client["ActionUUID"]
    }); 

    return {success:true,resultObject:{}}
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
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
        return { success:true, resultObject: result };
    } catch(err) {
        return { success: false, resultObject: err , errorMessage: `Error in upsert relation. error - ${err}`};
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