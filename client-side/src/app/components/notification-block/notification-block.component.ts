import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { NotificationsService } from '../../services/notifications.services';
import { AddonService } from '../../services/addon.service';
import { INotificationItem } from '../notifications/notifications.model';
import { config } from '../../addon.config';

@Component({
  selector: 'app-notification-block',
  templateUrl: './notification-block.component.html',
  styleUrls: ['./notification-block.component.css']
})
export class NotificationBlockComponent implements OnInit {
  items: INotificationItem[] = [];
  notificationsList = [];

  constructor(
    private notificationsService: NotificationsService,
    private addonService: AddonService,
  ) {
    this.addonService.addonUUID = config.AddonUUID;
  }

  ngOnInit() {
    this.configureItems();
  }

  async configureItems() {
    this.notificationsList = await this.notificationsService.getNotifications();
    for (const notification of this.notificationsList) {
      let item:INotificationItem = {
        key: notification.Key,
        date: notification.CreationDateTime,
        read: notification.Read,
        title: notification.Title,
        body: notification.Body,
      }
      this.items.push(item);
    }
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
