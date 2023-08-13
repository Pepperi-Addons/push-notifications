import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { config } from '../addon.config';
import { AddonService } from './addon.service';

@Injectable({
    providedIn: 'root'
})

export class NotificationsSetupService {
    constructor(
        private addonService: AddonService,
        private route: ActivatedRoute
    ) {
        this.addonService.addonUUID = config.AddonUUID;
    }

    async getDisplayTitleFromResource(titleField: string, resourceName: string, key: string): Promise<string>{
        let url = `/resources/${resourceName}?where=Key='${key}'`
        const res = await this.addonService.pepGet(encodeURI(url)).toPromise()
        return res[0][titleField]
       }

    async getListByKey(key: string){
        const url = `/addons/api/${this.addonService.addonUUID}/api/notifications_users_list_by_key?Key=${key}`
        return await this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    async deleteSendToList(sendToLists){
        let listToDelete:any[] = []
        sendToLists.map(list=>{
            listToDelete.push({Key:list})
        })
        let url = `/addons/api/${this.addonService.addonUUID}/api/delete_notifications_users_lists`
        return await this.addonService.pepPost(encodeURI(url),listToDelete).toPromise();
    }

    getUsersLists(){
        let url = `/addons/api/${this.addonService.addonUUID}/api/notifications_users_lists`
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    saveList(list){
        let url = `/addons/api/${this.addonService.addonUUID}/api/notifications_users_lists`
        return this.addonService.pepPost(encodeURI(url),list).toPromise();
    }
}