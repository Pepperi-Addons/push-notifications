import { Component, OnInit } from '@angular/core';
import { IPepGenericListActions, IPepGenericListDataSource, PepGenericListService } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { ActivatedRoute, Router } from '@angular/router';
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
    private genericListService: PepGenericListService,
    private route: ActivatedRoute,
    private router: Router,
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
       for (let notification of notificationsList) {
         let creationDate = new Date(notification.CreationDateTime);
         notification.Date = creationDate.getDate()+'/'+(creationDate.getMonth()+1)+'/'+creationDate.getFullYear();
       }

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
                FieldID: 'Date',
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
      if (data.rows.length === 1){
        actions.push({
          title: this.translate.instant("Duplicate"),
          handler: async (objs) => {
            let notification = this.genericListService.getItemById(objs.rows[0]);
            this.goToMessageCreator(notification);
          }
      });
      }
      

      return actions;
    }
  }

  goToMessageCreator(notification) {
    this.router.navigate(['../message_creator'], {
      relativeTo: this.route,
      queryParams: {
        "UserEmailList": notification.Fields[2]?.FormattedValue,
        "Title": notification.Fields[0]?.FormattedValue,
        "Body": notification.Fields[1]?.FormattedValue
      }
    })
  }

}
