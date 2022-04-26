import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AddonService } from './addon.service';

@Injectable({
    providedIn: 'root'
})

export class UserDevicesService {
    constructor(
        private addonService: AddonService,
        private route: ActivatedRoute
    ) {
        this.addonService.addonUUID = this.route.snapshot.params.addon_uuid;
    }

    getUserDevices() {
        const query =`?UserID=${this.addonService.userUUID}`;
        let url = `/addons/api/${this.addonService.addonUUID}/api/user_device`
        url = url + query;
        
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    removeUserDevices(devices) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/remove_devices`, devices).toPromise();
    }
}