import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { DefaultNotificationsPage, DefaultNotificationsSlug } from "shared"

export class DefaultPageCreator{
    private papiClient: PapiClient;
    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
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


        async createDefaultPage(){
            await this.createNotificationsSlug()
            await this.createNotificationsPage()
        }
}