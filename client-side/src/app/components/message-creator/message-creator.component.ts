import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    private translate: TranslateService,
    private router: Router,
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
    debugger
    this.showFinishDialog(ans);
  }

  showFinishDialog(ansFromBulkNotifications) {
    debugger
    let dialogMessage: string = JSON.parse(ansFromBulkNotifications.resultObject).errorMessage
    // for (const message of ansFromBulkNotifications.res) {
    //   if (message.Details != undefined) {
    //     dialogMessage = (dialogMessage ?? "").concat(message.Details).concat("\n");
    //   }
    // }

    if (dialogMessage === undefined) {
      dialogMessage = this.translate.instant("Messages_Sent_Successfuly");
    }

    let dialogData = {
      "Message": dialogMessage,
      "Title": "",
      "ButtonText": this.translate.instant("OK")
    }
    this.addonService.openDialog("", PopupDialogComponent, [], { data: dialogData }, () => {
      this.router.navigate(['../notifications_log'], {
        relativeTo: this.route,
      })
    });
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