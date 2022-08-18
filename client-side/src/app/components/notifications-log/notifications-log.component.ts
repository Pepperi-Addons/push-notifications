import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsLogService } from '../../services/notifications-log.services';
import { PopupDialogComponent } from '../popup-dialog/popup-dialog.component';
import { config } from '../../addon.config';

@Component({
  selector: 'app-notifications-log',
  templateUrl: './notifications-log.component.html',
  styleUrls: ['./notifications-log.component.scss']
})
export class NotificationsLogComponent implements OnInit {
  @ViewChild('glist1') glist1: GenericListComponent | undefined;

  constructor(    
    private translate: TranslateService,
    private notificationsLogService: NotificationsLogService,
    private addonService: AddonService,
    private route: ActivatedRoute,
    private router: Router,
    ) {
      this.addonService.addonUUID = config.AddonUUID;
     }

  ngOnInit() {
    this.addonService.getCurrentUserEmail().then((email) => this.currentUserEmail = email);
  }

  noDataMessage: string;
  dataSource: IPepGenericListDataSource = this.getDataSource();
  currentUserEmail: String;

  getDataSource() {
    this.noDataMessage = this.translate.instant("No_Notifications_Log_Error")
    return {
      init: async (params: any) => {
        let notificationsList = await this.notificationsLogService.getNotificationsLog();
        if (params.searchString) {
          notificationsList = notificationsList.filter(notification => {
            return (notification.Title.toLowerCase().includes(params.searchString.toLowerCase()) || notification.Body?.toLowerCase().includes(params.searchString.toLowerCase()))  
          })
          this.noDataMessage = this.translate.instant("No_Results_Error")
        }
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
                Title: this.translate.instant("Message_Body"),
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
                Title: this.translate.instant("Time"),
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
            selectionType: 'multi',
            noDataFoundMsg:this.noDataMessage
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
            let notification = this.glist1.getItemById(objs.rows[0]);
            this.goToMessageCreator(notification);
          }
      });
      }
      if(data.rows.length >= 1) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (objs) => {
            await this.notificationsLogService.deleteNotificationsLog(objs.rows);
            this.dataSource = this.getDataSource();

            let dialogData = {
              "Message": this.translate.instant("Notifications_Log_Deleted_Successfuly"),
              "Title": "",
              "ButtonText": this.translate.instant("OK")
            }
             this.addonService.openDialog("", PopupDialogComponent, [], { data: dialogData }, () => {});
          }
      });
      }

      return actions;
    }
  }
  
  goToMessageCreator(notification?) {
    if (notification === undefined) {
      // this.router.navigate(['../message_creator'], {
        this.router.navigate(['message_creator'], {
        relativeTo: this.route,
        queryParamsHandling: 'merge',
      });
    }
    else {
      // this.router.navigate(['../message_creator'], {
      this.router.navigate(['message_creator'], {
        relativeTo: this.route,
        queryParamsHandling: 'merge',
        queryParams: {
          "UserEmailList": notification.Fields[2]?.FormattedValue,
          "Title": notification.Fields[0]?.FormattedValue,
          "Body": notification.Fields[1]?.FormattedValue,
        }
      })
    }
  }

}
