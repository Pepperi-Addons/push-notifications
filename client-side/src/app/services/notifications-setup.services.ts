import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { config } from '../addon.config';
import { AddonService } from './addon.service';
import { IPepChip } from '@pepperi-addons/ngx-lib/chips';
import { NOTIFICATIONS_SEND_TO_COUNT_SOFT_LIMIT } from 'shared';

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

    async getDisplayTitlesFromResource(titleField: string, resourceName: string, keys: string[], excludedKeys: string[] = []): Promise<IPepChip[]>{
        const objs = await this.getAllResourceObjects(resourceName, [titleField], keys, excludedKeys)
        const chips: IPepChip[] = []
        objs.map(obj => {
            chips.push({key: obj.Key, value: obj[titleField]})
        })
        return chips

        // let url = `/resources/${resourceName}?where=Key='${key}'`
        // const res = await this.addonService.pepGet(encodeURI(url)).toPromise()
        // return res[0][titleField]
    }
    async getAllResourceObjects(resourceName: string, fields: string[], includeKeys: string[] = [], excludedKeys: string[] = []): Promise<any>{
        const url = `/resources/${resourceName}/search`
        const body = {
            PageSize: NOTIFICATIONS_SEND_TO_COUNT_SOFT_LIMIT,
            Fields: [...fields, 'Key'],
            IncludeCount: true,
            ...(includeKeys.length > 0) && {KeyList: includeKeys},
        }
        const res = await this.addonService.pepPost(encodeURI(url), body).toPromise()
        debugger
        // remove excluded keys
        if (excludedKeys){
            res.Objects = res.Objects.filter(obj => !excludedKeys.includes(obj.Key))
        }
        return res.Objects
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