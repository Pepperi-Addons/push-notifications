import { Component, OnInit, ViewChild, ViewContainerRef, ViewChildren,QueryList} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AddonService } from 'src/app/services/addon.service';
import { NotificationsService } from 'src/app/services/notifications.services';
import { PopupDialogComponent } from '../popup-dialog/popup-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { PepSnackBarData, PepSnackBarService } from '@pepperi-addons/ngx-lib/snack-bar';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { PepDefaultSnackBarComponent } from '@pepperi-addons/ngx-lib/snack-bar/default-snack-bar.component';
import { config } from '../../addon.config';
import { IPepChip, PepChipsComponent } from '@pepperi-addons/ngx-lib/chips';
import { PepAddonBlockLoaderService } from '@pepperi-addons/ngx-lib/remote-loader';
import { MatDialogRef } from '@angular/material/dialog';
import { NotificationsSetupService } from 'src/app/services/notifications-setup.services';
import { UsersListDataView, UsersLists, BulkMessageObject } from 'shared';
  


@Component({
  selector: 'app-message-creator',
  templateUrl: './message-creator.component.html',
  styleUrls: ['./message-creator.component.css']
})
export class MessageCreatorComponent implements OnInit {
  private currentSnackBar: MatSnackBarRef<PepDefaultSnackBarComponent> | null = null;
  @ViewChild('chipsComp') chipsComp: PepChipsComponent;
  @ViewChildren('userListChips') userListChips: QueryList<PepChipsComponent>;
  

  message: BulkMessageObject = {
    UsersUUID: [],
    SentTo: [],
    Title: "",
    Body: ""
  };
  chips: any[] = [];
  usersLists: any[] = []
  dialogRef: MatDialogRef<any> 

  constructor(
    private notificationsService: NotificationsService,
    private notificationsSetupService: NotificationsSetupService,
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
    this.notificationsSetupService.getUsersLists().then(list => {
      this.usersLists = list
    })
  }

  ngAfterViewInit() {
    this.handleDuplicateMessageParams();
  }

  private handleDuplicateMessageParams() {
    // get query params from url, from the previous page that added by duplicate message
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams != undefined) {
      this.message.Title = queryParams.Title || '';
      this.message.Body = queryParams.Body || '';
      this.handleUserList(queryParams.SentTo);
    }
  }
  
  private handleUserList(usersList: string) {
    // users list is a string of users emails separated by comma
    if (usersList != undefined) {
      const users = usersList.split(',');
      Promise.all(users.map(async user => {
        const userUUID = await this.addonService.getUUIDByEmail(user);
        this.chips.push({ key: userUUID, value: user });       

      })).then(() => {
        // this.chipsComp.chips = this.chips;
        this.chipsComp.addChipsToList(this.chips)
      }); 
    }
   
  }
  
  async sendNotifications() {
    if(this.userListChips.length > 0){
      this.sendGroupNotifications()
    }
    if(this.chipsComp.chips.length > 0){
      this.message.SentTo = this.chipsComp.chips.map(chips => chips.value)
      this.message.UsersUUID = this.chipsComp.chips.map(chips => chips.key)
      let ans = await this.notificationsService.bulkNotifications(this.message);
      this.showFinishDialog(ans);
    }
    this.router.navigate(['../'], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
    })

  }

  async sendGroupNotifications() {
    this.userListChips.toArray().forEach(async (listsChips, listIndex) =>{
      const listKey = this.usersLists[listIndex]
      listsChips.chips.map(async listChip =>{
        this.message.SentTo = [listChip.value]
        this.message.SelectedGroupKey = listChip.value
        this.message.ListKey = listKey
        let ans = await this.notificationsService.bulkNotifications(this.message);
        this.showFinishDialog(ans);
      })
    })


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
        content: this.translate.instant("Messages_Sent_Successfully")
      }
      this.currentSnackBar = this.pepSnackBarService.openDefaultSnackBar(snackbarData);
      this.currentSnackBar.instance.closeClick.subscribe(() => {
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

  async userListClicked(list: UsersLists ,chipsSelectorIndex: number){
    this.dialogRef = this.addonBlockService.loadAddonBlockInDialog({
      container: this.viewContainerRef,
      name: 'List',
      hostObject: this.getGenericHostObject(list),
      hostEventsCallback: async ($event) => {
        if($event.action == 'on-done'){
          await this.handleListSetupSelection($event.data.selectedObjects, list, chipsSelectorIndex)
          this.dialogRef.close();
        }
        if($event.action == 'on-cancel'){
          this.dialogRef.close();
        }
      }
    })
  }

  async handleListSetupSelection(selectedKeys: string[], list: UsersLists, chipsSelectorIndex: number) {
    // prepare the chips to add
    const chipsToAdd: IPepChip[] = await Promise.all(selectedKeys.map( async selectedKey => {
      const title = await this.notificationsSetupService.getDisplayTitleFromResource(list.TitleField, list.ResourceName, selectedKey)
      const chipObj: IPepChip = {
        value: title,
        key: selectedKey
      }
      return chipObj;
    }));

    // add the chips to the chips selector
    this.addChipsToList(chipsToAdd, chipsSelectorIndex);    
  }

  private addChipsToList(chipsToAdd: IPepChip[], chipsSelectorIndex: number) {
    // filter out chips that already exist in the chips selector
    const filteredChipsToAdd = chipsToAdd.filter(chip => !this.isChipAlreadyExist(chip, chipsSelectorIndex));
    if (filteredChipsToAdd.length > 0) {
      this.userListChips.toArray()[chipsSelectorIndex].addChipsToList(filteredChipsToAdd);
    }  
  }

  private isChipAlreadyExist(chip: IPepChip, chipsSelectorIndex: number): boolean {
    return this.userListChips.toArray()[chipsSelectorIndex].chips.some(existingChip => existingChip.key === chip.key);
  }

  getUsersList(): any{
    return UsersListDataView;
  }

  getGenericPickerList(list){
    console.log(list)
    return {
      List: {
        Key: `Notifications_List_${list.ListName}`,
        Name: `list ${list.ListName}`,
        Resource: list.ResourceName,
        Views: [{
          Key: `notifications_${list.ListName}_view`,
          Type: "Grid",
          Title: list.ListName,
          Blocks: list.SelectionDisplayFields.map(field => this.getSingleGenericField(field))
        }]
      },
      State: {
        ListKey: `Notifications_List_${list.ListName}`,
      }
    }
  }

  getSingleGenericField(field: string){
    return {
      Title: field,
      Configuration: {
          Type: "TextBox",
          FieldID: field,
          Width: 10
      }
  }
}

getGenericHostObject(list){
  const hostObject = {
    listContainer: this.getGenericPickerList(list),
    inDialog: true
  }
  return hostObject
}


  getUsersHostObject(){
    const hostObject = {
      listContainer: this.getUsersList(),
      inDialog: true
    }
    return hostObject
  }

  externalSourceClicked() {
    this.dialogRef = this.addonBlockService.loadAddonBlockInDialog({
      container: this.viewContainerRef,
      name: 'List',
      hostObject: this.getUsersHostObject(),
      hostEventsCallback: async ($event) => {
        if($event.action == 'on-done'){
          console.log($event)
          let newChips: any[]  = [];
          await Promise.all($event.data.selectedObjects.map( async chip => {
            let chipObj = { 
              value: await this.addonService.getUserEmailByUUID(chip),
              key: chip
            }
            if(!this.chipsComp.chips.includes(chipObj))
            newChips.push(chipObj)
          }))
          this.chipsComp.addChipsToList(newChips);  
          this.dialogRef.close();
        }
        if($event.action == 'on-cancel'){
          this.dialogRef.close();
        }
      }
    })
  }
}