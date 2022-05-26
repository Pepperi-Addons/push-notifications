import { Component, OnInit } from '@angular/core';
import { IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationsLogService } from '../../services/notifications-log.services';

@Component({
  selector: 'app-notifications-log',
  templateUrl: './notifications-log.component.html',
  styleUrls: ['./notifications-log.component.css']
})
export class NotificationsLogComponent implements OnInit {

  constructor(    
    private translate: TranslateService,
    private notificationsLogService: NotificationsLogService,
    private addonService: AddonService,
    private route: ActivatedRoute
    ) {
      this.addonService.addonUUID = this.route.snapshot.params.addon_uuid;
     }

  ngOnInit() {
  }

  noDataMessage: string;
  dataSource: IPepGenericListDataSource = this.getDataSource();

  getDataSource() {
    return {
      init: async (params: any) => {
        let notificationsList = await this.notificationsLogService.getNotificationsLog();
       // this.noDataMessage = this.translate.instant("No_Devices_Error");

        return Promise.resolve({
          dataView: {
            Context: {
              Name: '',
              Profile: { InternalID: 0 },
              ScreenSize: 'Landscape'
            },
            Type: 'Grid',
            Title: 'Notifications',
            Fields: [
              {
                FieldID: 'Title',
                Type: 'TextBox',
                Title: this.translate.instant("Title"),
                Mandatory: true,
                ReadOnly: true
              },
              {
                FieldID: 'Body',
                Type: 'TextBox',
                Title: this.translate.instant("Body"),
                Mandatory: false,
                ReadOnly: true
              },
              {
                FieldID: 'UsersList',
                Type: 'TextBox',
                Title: this.translate.instant("Sent_To"),
                Mandatory: false,
                ReadOnly: true
              },
              {
                FieldID: 'CreationDateTime',
                Type: 'TextBox',
                Title: this.translate.instant("Date"),
                Mandatory: false,
                ReadOnly: true
              }
            ],
            Columns: [
              {
                Width: 20
              },
              {
                Width: 20
              },
              {
                Width: 20
              },
              {
                Width: 20
              },
              {
                Width: 20
              }
            ],

            FrozenColumnsCount: 0,
            MinimumColumnWidth: 0
          },
          totalCount: notificationsList.length,
          items: notificationsList
        });
      },
      inputs: () => {
        return Promise.resolve(
          {
            pager: {
              type: 'scroll'
            },
            selectionType: 'multi'
          }
        );
      },
    } as IPepGenericListDataSource
  }

  actions: IPepGenericListActions = {
    get: async (data) => {
      const actions = [];
      if (data.rows.length === 1 || data?.selectionType == 0){
        actions.push({
          title: this.translate.instant("Duplicate"),
          handler: async (objs) => {
            debugger
           await this.notificationsLogService.duplicateNotificationsLog(objs.rows[0]);
           this.dataSource = this.getDataSource();
          }
      });
      }
      

      return actions;
    }
  }

}
