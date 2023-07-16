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

    deleteSendToList(sendTolists){
        let listToDelete:any[] = []
        sendTolists.map(list=>{
            listToDelete.push({Key:list})
        })
        let url = `/addons/api/${this.addonService.addonUUID}/api/delete_notifications_users_lists`
        return this.addonService.pepPost(encodeURI(url),listToDelete).toPromise();
    }

    getResourceList(){
        let url = `/addons/api/${this.addonService.addonUUID}/api/get_resource_lists`
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    getResourceFields(resource){
        let url = `/addons/api/${this.addonService.addonUUID}/api/get_resource_fields`
        return this.addonService.pepPost(encodeURI(url),resource).toPromise();
    }

    getMappingCollections(resource){
        let url = `/addons/api/${this.addonService.addonUUID}/api/get_mapping_collections`
        return this.addonService.pepPost(encodeURI(url),resource).toPromise();
    }

    getUserReferenceFields(resource){
        let url = `/addons/api/${this.addonService.addonUUID}/api/get_user_reference_fields`
        return this.addonService.pepPost(encodeURI(url),resource).toPromise();
    }

    getUsersLists(){
        let url = `/addons/api/${this.addonService.addonUUID}/api/notifications_users_lists`
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }
}