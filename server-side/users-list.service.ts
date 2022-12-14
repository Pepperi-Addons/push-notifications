import { PapiClient, AddonData,AddonDataScheme } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { USERS_LISTS_TABLE_NAME } from 'shared'
import { v4 as uuid } from 'uuid';

class UsersListsService {
    papiClient: PapiClient
    addonSecretKey: string
    addonUUID: string;
    accessToken: string;
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
    }

    async getNotificationsUsersLists(query){
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(USERS_LISTS_TABLE_NAME).iter(query).toArray();
    }

    async upsertNotificationsUsersLists(body){
        if(!body.Key){
            body.Key = uuid();
        }
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(USERS_LISTS_TABLE_NAME).upsert(body);
    }

    async deleteNotificationsUsersLists(lists){
        Promise.all(lists.map(async (list) => {
            let deleteJson = {
                Key:list.Key,
                Hidden: true
            }
            try {
                return await this.papiClient.addons.data.uuid(this.addonUUID).table(USERS_LISTS_TABLE_NAME).upsert(deleteJson)
            }
            catch{
                throw new Error(`Could not delete list with UUID ${list.Key}`)
            }
        }))
    }

    async getResourceLists(query){
        let resourceList: string[] = []
        let resources = await this.papiClient.resources.resource('resources').get()
        for(let resource in resources){
            resourceList.push(resources[resource]['Name'])
        }
        return resourceList
    }

    async getResourceFields(body){
        let fields:string[] = []
        let resource = await this.papiClient.resources.resource('resources').search(body)
        for(let field in resource[0]["Fields"]){
            fields.push(field)
        }
        return fields
    }

    async createUsersListsResource(papiClient:PapiClient) {
        const notificationsUsersListsScheme: AddonDataScheme={
            Name: USERS_LISTS_TABLE_NAME,
            Type: 'meta_data',
            Fields: {
                ListName: {
                    Type: 'String'
                },
                ResourceListUUID: {
                    Type: 'String'
                },
                SelectionViewUUID: {
                    Type: 'String'
                },
                DisplayTitleField: {
                    Type: 'String'
                },
                MappingResourceUUID: {
                    Type: 'String'
                },
                UserReferenceField: {
                    Type: 'String'
                }
            }
            
        };
        try {
            await papiClient.addons.data.schemes.post(notificationsUsersListsScheme);
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
}

export default UsersListsService;