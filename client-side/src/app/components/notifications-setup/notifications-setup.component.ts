import { Component, OnInit, ViewChild, ViewContainerRef , TemplateRef} from '@angular/core';
import { GenericListComponent, IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsSetupService } from '../../services/notifications-setup.services';
import { PepAddonBlockLoaderService } from '@pepperi-addons/ngx-lib/remote-loader';
import { PepSnackBarService } from '@pepperi-addons/ngx-lib/snack-bar';
import { config } from '../../addon.config';
import { MatDialogRef } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog'; 
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
        private dialogService: PepDialogService,
        // private dialogActions: PepDialogActionsType='cancel-ok',
        // private templateRef: TemplateRef<'list-form.component.html'>,
        ) {
          this.addonService.addonUUID = config.AddonUUID;
         }
    dialogRef: MatDialogRef<any>
    @ViewChild('listForm', { read: TemplateRef }) listForm:TemplateRef<any>;
 
      ngOnInit() {
        
      }
    
      cancel(){
        this.dialogRef.close()
      }

      saveList(){
        console.log('Save clicked')
        this.dialogRef.close()
      }

      dataSource: IPepGenericListDataSource = this.getDataSource();

      getDataSource(){
        return null
      }

      actions: IPepGenericListActions = {
        get: async (data) => {
          const actions = [];
          if(data.rows.length >= 1) {
            actions.push({
              title: this.translate.instant("Delete"),
              handler: async (objs) => {
                await this.notificationsSetupService.deleteSendToList(objs.rows);
                this.dataSource = this.getDataSource();
              }
          });
          }
    
          return actions;
        }
      }

      addList(){
        this.dialogRef = this.dialogService.openDialog(this.listForm,'',{disableClose:false})
      }
}