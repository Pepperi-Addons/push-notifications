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
        let url = `/addons/api/${this.addonService.addonUUID}/api/delete_notifications_users_lists`
        return this.addonService.pepPost(encodeURI(url),sendTolists).toPromise();
    }

    getResourceList(){
        let url = `/addons/api/${this.addonService.addonUUID}/api/get_resource_lists`
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }
}