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

    async getUserUUIDFromView(mappingField,resource,key){
        let userUUID:string[] =[]
        let url = `/resources/${resource}`
        await this.addonService.pepGet(encodeURI(url)).toPromise().then(res =>{
            res.map(user =>{
                  if(key == user.Key){
                    return userUUID.push(user[mappingField])
                  } 
            })
        });
        return userUUID.pop()
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