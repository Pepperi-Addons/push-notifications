import { Component, OnInit } from '@angular/core';
import { NotificationsService } from '../../services/notifications.services';
import { AddonService } from '../../services/addon.service';
import { INotificationItem } from '../notifications/notifications.model';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { config } from '../../addon.config';
import { TranslateService } from '@ngx-translate/core';
import {notificationReadStatus} from 'shared'

@Component({
  selector: 'app-notification-block',
  templateUrl: './notification-block.component.html',
  styleUrls: ['./notification-block.component.css']
})
export class NotificationBlockComponent implements OnInit {
  items: INotificationItem[] = null;
  notificationsList = [];
  screenSize: PepScreenSizeType;

  constructor(
    private translate: TranslateService,
    private notificationsService: NotificationsService,
    private addonService: AddonService,
    public layoutService: PepLayoutService
  ) {
    this.addonService.addonUUID = config.AddonUUID;

    this.layoutService.onResize$.subscribe(size => {
      this.screenSize = size;
    });
  }

  ngOnInit() {
    this.configureItems().then((notifications) => this.items = notifications);
  }

  async configureItems() {
    let notificationsItems: Array<any> = null;
    this.notificationsList = await this.notificationsService.getNotifications(`UserUUID='${this.addonService.userUUID}'`);
    notificationsItems = this.notificationsList.length > 0 ? [] : null;
    for (const notification of this.notificationsList) {
      let item: INotificationItem = {
        key: notification.Key,
        date: notification.CreationDateTime,
        read: notification.Read,
        title: notification.Title,
        body: notification.Body,
        from: notification.CreatorName,
        navigationPath: notification.NavigationPath,
        goToActivityName: notification.NavigationPath != undefined ? this.translate.instant("Go_To_Activity_Name") : undefined
      }
      notificationsItems.push(item);
    }
    return notificationsItems;
  }

  async MarkAllAsReadClick() {
    await this.notificationsService.updateNotificationsReadStatus(
      {
        "Read": true,
        "Keys": this.notificationsList.map(notification => {
          return notification.Key
        })
      } as notificationReadStatus );
  }

  async itemReadClick(event) {
    await this.notificationsService.updateNotificationReadStatus(
      {
        "Read": event.read,
        "Key": event.key
      });
  }
}
