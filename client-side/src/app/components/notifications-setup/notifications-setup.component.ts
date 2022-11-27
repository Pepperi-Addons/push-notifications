import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsSetupService } from '../../services/notifications-setup.services';
import { PopupDialogComponent } from '../popup-dialog/popup-dialog.component';
import { config } from '../../addon.config';

@Component({
  selector: 'app-notifications-setup',
  templateUrl: './notifications-setup.component.html',
  styleUrls: ['./notifications-setup.component.scss']
})
export class NotificationsSetupComponent implements OnInit {
    constructor(    
        private translate: TranslateService,
        private notificationsSetupService: NotificationsSetupService,
        private addonService: AddonService,
        private route: ActivatedRoute,
        private router: Router,
        ) {
          this.addonService.addonUUID = config.AddonUUID;
         }
    
      ngOnInit() {
        
      }
}