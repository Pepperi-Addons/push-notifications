import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AddonService } from 'src/app/services/addon.service';
import { NotificationsService } from 'src/app/services/notifications.services';

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
    public route: ActivatedRoute
  ) { 
    this.addonService.addonUUID = this.route.snapshot.params.addon_uuid;
  }

  ngOnInit() {
  }

  async sendNotifications() {
    // await this.notificationsService.createNotificationsByEmails(this.message);
  }

  onValueChanged(element, $event) {
  }

}

export type MessageObject = {
  Recipients: string,
  Subject: string,
  Body: string
} 