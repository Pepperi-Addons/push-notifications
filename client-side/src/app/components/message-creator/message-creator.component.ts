import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AddonService } from 'src/app/services/addon.service';
import { NotificationsService } from 'src/app/services/notifications.services';
import { PopupDialogComponent } from '../popup-dialog/popup-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-message-creator',
  templateUrl: './message-creator.component.html',
  styleUrls: ['./message-creator.component.css']
})
export class MessageCreatorComponent implements OnInit {

  message: MessageObject = {
    Recipients: "",
    Subject: "",
    Body: ""
  };

  constructor(
    private notificationsService: NotificationsService,
    private addonService: AddonService,
    public route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.addonService.addonUUID = this.route.snapshot.params.addon_uuid;
  }

  ngOnInit() {
  }

  async sendNotifications() {
    const emails: string[] = this.message.Recipients.split(";");
    if (emails.length > 100) {
      let message = this.translate.instant("Max_Users_Error");
      let dialogData = {
        "Message": message,
        "Title": ""
      }
      this.addonService.openDialog("", PopupDialogComponent, [], { data: dialogData }, () => {});
    }
    else {
      let notifications = [];
      for (let email of emails) {
        let notification = {
          "Email": email,
          "Title": this.message.Subject,
          "Body": this.message.Body
        }
        notifications.push(notification);
      }
      this.notificationsService.importNotifications(notifications);
    }
  }

  onValueChanged(element, $event) {
  }
}

export type MessageObject = {
  Recipients: string,
  Subject: string,
  Body: string
} 