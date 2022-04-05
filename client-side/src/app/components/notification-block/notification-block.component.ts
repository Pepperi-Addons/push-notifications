import { Component, OnInit } from '@angular/core';
import { NotificationsService } from '../../services/notifications.services';
import { TranslateService } from '@ngx-translate/core';
import { IPepGenericListActions, IPepGenericListDataSource, IPepGenericListPager, PepGenericListService } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { AddonService } from '../../services/addon.service';
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { NotificationFormComponent, NotificationsFormData } from "../notification-form";
import { FormDataView } from "@pepperi-addons/papi-sdk";
import { ObjectsDataRowCell } from '@pepperi-addons/ngx-lib';
import { Notification } from '../../../../../shared/entities';

@Component({
  selector: 'app-notification-block',
  templateUrl: './notification-block.component.html',
  styleUrls: ['./notification-block.component.css']
})
export class NotificationBlockComponent implements OnInit {

  constructor(
    private translate: TranslateService,
    private notificationsService: NotificationsService,
    private addonService: AddonService,
    private dialogService: PepDialogService,
    private genericListService: PepGenericListService
  ) {
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

      if (data.rows.length === 1 && data?.selectionType != 0) {
        actions.push({
          title: this.translate.instant('Edit'),
          handler: async (objs) => {
              this.navigateToNotificationsForm(objs.rows[0]);
          }
      });
      }
      if (data.rows.length >= 1 || data?.selectionType === 0) {
        actions.push({
          title: this.translate.instant("Mark_As_Read"),
          handler: async (data) => {
            this.markNotificationsAsRead(data.rows);
          }
        });
      }
      return actions;
    }
  }

  async markNotificationsAsRead(notifications) {
    await this.notificationsService.markNotificationsAsRead(notifications);
    this.dataSource = this.getDataSource();
  }

  navigateToNotificationsForm(notificationKey: string) {
    const listNotification = this.genericListService.getItemById(notificationKey);
    let notification = {};
    if (listNotification) {
      notification['Key'] = notificationKey;
      listNotification?.Fields.forEach((rowItem: ObjectsDataRowCell) => {
        notification[rowItem.ApiName] = rowItem.Value;
        });
    }

    const formData: NotificationsFormData = {
      Notification: notification,
      DataView: this.getFormDataView(),
    }
    const config = this.dialogService.getDialogConfig({}, 'inline');
    config.data = new PepDialogData({
      content: NotificationFormComponent
    })
    this.dialogService.openDialog(NotificationFormComponent, formData, config).afterClosed().subscribe(() => {
      this.markNotificationsAsRead([notificationKey]);
    });
    
  }

  getFormDataView(): FormDataView {
    let dataView: FormDataView = {
      Type: "Form",
      Fields: [
        {
          FieldID: 'Title',
          Type: 'TextArea',
          Title: "Title",
          Mandatory: true,
          ReadOnly: true
        },
        {
          FieldID: 'Body',
          Type: 'TextArea',
          Title: "Body",
          Mandatory: true,
          ReadOnly: true
         },
      //   {
      //   'FieldID': 'Linked object',
      //   'Type': 'Link',
      //   'Title': "Linked object",
      //   'Mandatory': true,
      //   'ReadOnly': true
      // }
      ],
      Context: {
        Name: "",
        Profile: {},
        ScreenSize: 'Tablet'
      }
    };
    return dataView;
  }
}
