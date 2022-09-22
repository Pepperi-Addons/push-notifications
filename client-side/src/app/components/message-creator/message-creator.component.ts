import { Component, DebugElement, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AddonService } from 'src/app/services/addon.service';
import { NotificationsService } from 'src/app/services/notifications.services';
import { PopupDialogComponent } from '../popup-dialog/popup-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { PepSnackBarData, PepSnackBarService } from '@pepperi-addons/ngx-lib/snack-bar';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { PepDefaultSnackBarComponent } from '@pepperi-addons/ngx-lib/snack-bar/default-snack-bar.component';
import { config } from '../../addon.config';
import { PepChipsComponent } from '@pepperi-addons/ngx-lib/chips';
import { PepAddonBlockLoaderService } from '@pepperi-addons/ngx-lib/remote-loader';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';



@Component({
  selector: 'app-message-creator',
  templateUrl: './message-creator.component.html',
  styleUrls: ['./message-creator.component.css']
})
export class MessageCreatorComponent implements OnInit {
  private currentSnackBar: MatSnackBarRef<PepDefaultSnackBarComponent> | null = null;
  @ViewChild('chipsComp') chipsComp: PepChipsComponent;

  message: MessageObject = {
    UserEmailList: [],
    Title: "",
    Body: ""
  };
  chips: any[] = [];
  dialogRef: MatDialogRef<any> 

  constructor(
    private notificationsService: NotificationsService,
    private addonService: AddonService,
    public route: ActivatedRoute,
    private translate: TranslateService,
    private router: Router,
    private pepSnackBarService: PepSnackBarService,
    private addonBlockService: PepAddonBlockLoaderService,
    private viewContainerRef: ViewContainerRef
  ) {
    this.addonService.addonUUID = config.AddonUUID;
  }

  ngOnInit() {
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams != undefined) {
      this.message.Title = queryParams.Title;
      this.message.Body = queryParams.Body;
    }
  }

  async sendNotifications() {
    this.message.UserEmailList = this.chipsComp.chips.map(chips => chips.value)
    let ans = await this.notificationsService.bulkNotifications(this.message);
    this.showFinishDialog(ans);
  }

  showFinishDialog(ansFromBulkNotifications) {
    let dialogMessage: string = undefined;
    for (const message of ansFromBulkNotifications) {
      if (message.Details != undefined) {
        dialogMessage = (dialogMessage ?? "").concat(message.Details).concat("\n");
      }
    }
    if (dialogMessage === undefined) {
      let snackbarData : PepSnackBarData = {
        title: this.translate.instant("Success"),
        content: this.translate.instant("Messages_Sent_Successfuly")
      }
      this.currentSnackBar = this.pepSnackBarService.openDefaultSnackBar(snackbarData);
      this.currentSnackBar.instance.closeClick.subscribe(() => {
        this.router.navigate(['../'], {
          relativeTo: this.route,
          queryParamsHandling: 'merge',
        })
    });
    }
    else {
      let dialogData = {
        "Message": dialogMessage,
        "Title": "",
        "ButtonText": this.translate.instant("OK")
      }
      this.addonService.openDialog("", PopupDialogComponent, [], { data: dialogData }, () => {
        this.router.navigate(['../'], {
          relativeTo: this.route,
          queryParamsHandling: 'merge',
        })
      });
    }
  }
  onBackButtonClicked() {
    this.router.navigate(['../'], {
          relativeTo: this.route,
          queryParamsHandling: 'merge',
    });
  }

  externalSourceClicked() {
    this.dialogRef = this.addonBlockService.loadAddonBlockInDialog({
      container: this.viewContainerRef,
      name: 'ResourceSelection',
      hostObject: {
        resource: "users",
        selectionMode: 'multi'
      },
      hostEventsCallback: ($event) => {
        if($event.action == 'on-save'){
          this.notificationsService.getUsersEmails($event.data.selectedObjectKeys).then((users) => {
            let newChips: any[]  = [];
            users.forEach(user => {
                let chipObj = { 
                value: user.Email 
              }
              if(!this.chipsComp.chips.includes(chipObj)) 
              newChips.push(chipObj)
            });
            this.chipsComp.addChipsToList(newChips); 
          });
          this.dialogRef.close();
        }
        if($event.action == 'on-cancel'){
          this.dialogRef.close();
        }
      }
    })
  }
}

export type MessageObject = {
  UserEmailList?: string[],
  Title: string,
  Body: string
} 