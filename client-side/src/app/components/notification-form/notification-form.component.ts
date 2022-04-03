import { Component, OnInit, Inject } from '@angular/core';
import { AddonData, FormDataView } from '@pepperi-addons/papi-sdk';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { IPepGenericFormValueChange } from '@pepperi-addons/ngx-composite-lib/generic-form';

@Component({
  selector: 'app-notification-form',
  templateUrl: './notification-form.component.html',
  styleUrls: ['./notification-form.component.css']
})
export class NotificationFormComponent implements OnInit {

  notification: AddonData = {};
  error: string;

  constructor(
    private dialogRef: MatDialogRef<NotificationFormComponent>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public incoming: NotificationsFormData
  ) { }

  ngOnInit() {
    debugger
    this.notification = this.incoming.Notification;
  }

  close() {
    this.dialogRef.close();
  }

  onValueChanged(event: IPepGenericFormValueChange) {
    console.log(event);
  }

}

export type NotificationsFormData = {
  Notification: any,
  DataView: FormDataView,
}