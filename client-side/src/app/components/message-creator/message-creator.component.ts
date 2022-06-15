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
    UserEmailList: [],
    Recipients: "",
    Title: "",
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
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams != undefined) {
      this.message.Title = queryParams.Title;
      this.message.Body = queryParams.Body;
      this.message.Recipients = queryParams.UserEmailList.replace(",", ";");
    }
  }

  async sendNotifications() {
     this.message.UserEmailList = this.message.Recipients.split(";");
     let ans = await this.notificationsService.bulkNotifications(this.message);
     console.log(ans);

  }

  onValueChanged(element, $event) {
  }
}

export type MessageObject = {
  UserEmailList?: string[],
  Recipients: string,
  Title: string,
  Body: string
} 