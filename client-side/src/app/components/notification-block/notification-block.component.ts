import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NotificationsService } from '../../services/notifications.services';
import { AddonService } from '../../services/addon.service';
import { INotificationItem } from '../notifications/notifications.model';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { config } from '../../addon.config';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-notification-block',
  templateUrl: './notification-block.component.html',
  styleUrls: ['./notification-block.component.css']
})
export class NotificationBlockComponent implements OnInit {
  items: INotificationItem[] = [];
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
    let notificationsItems = [];
    this.notificationsList = await this.notificationsService.getNotifications();
    for (const notification of this.notificationsList) {
      let item: INotificationItem = {
        key: notification.Key,
        date: notification.CreationDateTime,
        read: notification.Read,
        title: notification.Title,
        body: notification.Body,
        from: notification.CreatorName,
        navigationPath: notification.NavigationPath,
        goToActivityName: this.translate.instant("Go_To_Activity_Name")
      }
      notificationsItems.push(item);
    }
    return notificationsItems;
  }

  async MarkAllAsReadClick() {
    await this.notificationsService.updateNotificationReadStatus(
      {
        "Read": true,
        "Keys": this.notificationsList.map(notification => {
          return notification.Key
        })
      });
  }

  async itemReadClick(event) {
    await this.notificationsService.updateNotificationReadStatus(
      {
        "Read": event.read,
        "Keys": [event.key]
      });
  }
}
