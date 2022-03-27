import { Component, OnInit } from '@angular/core';
import {NotificationsService} from '../../services/notifications.services';
import { TranslateService } from '@ngx-translate/core';
import { IPepGenericListActions, IPepGenericListDataSource, IPepGenericListPager, PepGenericListService } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { AddonService } from '../../services/addon.service';

@Component({
  selector: 'app-notification-block',
  templateUrl: './notification-block.component.html',
  styleUrls: ['./notification-block.component.css']
})
export class NotificationBlockComponent implements OnInit {

  constructor(
    private translate: TranslateService,
    private notificationsService: NotificationsService,
    private addonService: AddonService
    ){
      this.addonService.addonUUID = "95025423-9096-4a4f-a8cd-d0a17548e42e"
     }

  ngOnInit() {
  }

  noDataMessage: string;
  dataSource: IPepGenericListDataSource = this.getDataSource();

  getDataSource() {
    return {
      init: async (params: any) => {
        let notificationsList = await this.notificationsService.getNotifications();
        this.noDataMessage = this.translate.instant("No_Notifications_Error");

        if (params.searchString != undefined && params.searchString != "") {
          notificationsList = notificationsList.filter(notification => notification.UserUUID.toLowerCase().includes(params.searchString.toLowerCase()))
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
                FieldID: 'UserUUID',
                Type: 'TextBox',
                Title: this.translate.instant("User_UUID"),
                Mandatory: true,
                ReadOnly: true
              },
              {
                FieldID: 'CreatorUUID',
                Type: 'TextBox',
                Title: this.translate.instant("Creator_UUID"),
                Mandatory: false,
                ReadOnly: true
              },
              {
                FieldID: 'Title',
                Type: 'TextBox',
                Title: this.translate.instant("Title"),
                Mandatory: false,
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
              FieldID: 'Read',
              Type: 'Boolean',
              Title: this.translate.instant("Read"),
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

      if (data.rows.length >= 1 || data?.selectionType === 0) {
        actions.push({
          title: this.translate.instant("Mark_As_Read"),
          handler: async (data) => {
            //TODO: Check what the data contains
              this.markNotificationsAsRead(data);
          }
        });
      }
      return actions;
    }
  }

  markNotificationsAsRead(notifications) {
    this.notificationsService.markNotificationsAsRead(notifications);
  }

}
