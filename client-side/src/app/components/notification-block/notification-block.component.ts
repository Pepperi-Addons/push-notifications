import { Component, OnInit } from '@angular/core';
import { NotificationsService } from '../../services/notifications.services';
import { TranslateService } from '@ngx-translate/core';
import { IPepGenericListActions, IPepGenericListDataSource, IPepGenericListPager, PepGenericListService } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { AddonService } from '../../services/addon.service';
import { FormDataView } from "@pepperi-addons/papi-sdk";
import { ObjectsDataRowCell } from '@pepperi-addons/ngx-lib';
import { config } from '../../addon.config';

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
    private genericListService: PepGenericListService
  ) {
    this.addonService.addonUUID = config.AddonUUID;
  }

  ngOnInit() {
  }

  noDataMessage: string;
  dataSource: IPepGenericListDataSource = this.getDataSource();
  isFormView: boolean = false;
  notification = {};
  dataView = {};

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
                FieldID: 'CreationDateTime',
                Type: 'TextBox',
                Title: this.translate.instant("Creation_Date"),
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
                Width: 15
              },
              {
                Width: 20
              },
              {
                Width: 5
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
          title: this.translate.instant("View"),
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
    await this.notificationsService.markNotificationsAsRead(
      {
      "Keys": notifications
    });
    this.dataSource = this.getDataSource();
  }

  async navigateToNotificationsForm(notificationKey: string) {
    this.isFormView = true;
    const selectedNotification = this.genericListService.getItemById(notificationKey);
    if (selectedNotification) {
      await this.markNotificationsAsRead([notificationKey]);
      this.dataSource = this.getDataSource();
      this.notification['Key'] = notificationKey;
      selectedNotification?.Fields.forEach((rowItem: ObjectsDataRowCell) => {
        this.notification[rowItem.ApiName] = rowItem.Value;
        });
    }
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
        {
         FieldID: 'CreatorUUID',
         Type: 'TextArea',
         Title: "Creator",
         Mandatory: true,
         ReadOnly: true
        },
        {
          FieldID: 'CreationDateTime',
          Type: 'TextArea',
          Title: "Creation date",
          Mandatory: true,
          ReadOnly: true
         },
        {
        FieldID: 'Read',
        Type: 'Boolean',
        Title: "Read",
        Mandatory: true,
        ReadOnly: true
      }
      ],
      Context: {
        Name: "",
        Profile: {},
        ScreenSize: 'Tablet'
      }
    };
    return dataView;
  }


  onValueChanged(event) {
    console.log(event);
  }

  close() {
    this.isFormView = false;
  }
}
