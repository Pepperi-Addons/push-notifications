import { PapiClient, AddonDataScheme, AddonData } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { USERS_LISTS_TABLE_NAME, UsersLists, DefaultAccountBuyersList, usersListFields } from 'shared'
import { v4 as uuid } from 'uuid';

class UsersListsService {
    papiClient: PapiClient
    addonSecretKey: string
    addonUUID: string;
    accessToken: string;
    constructor(client: Client) {
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

    async getNotificationsUsersLists(query?): Promise<AddonData[]>{
        try {
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(USERS_LISTS_TABLE_NAME).iter(query).toArray();
        }
        catch (error){
            throw error
        }
    }

    async getSetupListByKey(key: string): Promise<UsersLists>{
        try {
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(USERS_LISTS_TABLE_NAME).key(key).get() as UsersLists
        }
        catch (error){
            throw error
        }
    }

    // this function is getting a list key, and selected group and returns a list of users UUIDs
    // that are in the selected group using the list data - resource and mapping resource and reference fields
    async getUserUUIDsFromGroup(listKey: string, selectedGroupKey: string): Promise<string[]>{
        const listData: UsersLists = await this.getSetupListByKey(listKey);
        const usersUUIDs: string[] = [];
        const resourceData = await this.papiClient.resources.resource(listData.MappingResourceName).get({where: `${listData.ResourceReferenceField}='${selectedGroupKey}'`});
        resourceData.forEach(row => {
            usersUUIDs.push(row[`${listData.UserReferenceField}`]);
        })
        return usersUUIDs;
    }

    async upsertNotificationsUsersLists(body){
        if (!body.Key){
            body.Key = uuid();
        }
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(USERS_LISTS_TABLE_NAME).upsert(body);
    }

    async deleteNotificationsUsersLists(lists){
        Promise.all(lists.map(async (list) => {
            const deleteJson = {
                Key: list.Key,
                Hidden: true
            }
            try {
                return await this.papiClient.addons.data.uuid(this.addonUUID).table(USERS_LISTS_TABLE_NAME).upsert(deleteJson)
            }
            catch {
                throw new Error(`Could not delete list with UUID ${list.Key}`)
            }
        }))
    }

    async createDefaultLists(){
        try {
            await this.upsertNotificationsUsersLists(DefaultAccountBuyersList)
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

    async createUsersListsResource(papiClient:PapiClient) {
        const notificationsUsersListsScheme: AddonDataScheme = usersListFields
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
                errorMessage: err ? err : 'Unknown Error Occurred',
            }
        }
    }
}

export default UsersListsService;
