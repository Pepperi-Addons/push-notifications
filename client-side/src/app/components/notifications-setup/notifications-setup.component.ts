import { Component, OnInit, ViewChild, TemplateRef,Inject, Injector} from '@angular/core';
import { IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
// import { AddonData,FormDataView } from '@pepperi-addons/papi-sdk';
import { NotificationsSetupService } from '../../services/notifications-setup.services';
import { config } from '../../addon.config';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PepDialogActionButton, PepDialogService } from '@pepperi-addons/ngx-lib/dialog'; 
import { IPepDraggableItem } from '@pepperi-addons/ngx-lib/draggable-items';
import { UsersListSetupComponent } from './users-list-setup/users-list-setup.component';
import { FieldSelectorComponent } from './field-selector/field-selector.component';
// import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-notifications-setup',
  templateUrl: './notifications-setup.component.html',
  styleUrls: ['./notifications-setup.component.scss']
})

export class NotificationsSetupComponent implements OnInit {
    dialogData: any

    cancelDropArea = []
    selectDropArea = []

    dataSource: IPepGenericListDataSource
    // fieldSelectorComponent: FieldSelectorComponent
    constructor(    
        protected injector: Injector,
        protected translate: TranslateService,
        protected notificationsSetupService: NotificationsSetupService,
        protected addonService: AddonService,
        protected dialogService: PepDialogService,
        ) {
          this.addonService.addonUUID = config.AddonUUID;
          // this.fieldSelectorComponent = new FieldSelectorComponent(injector, translate, notificationsSetupService, addonService, dialogService)
         }
    dialogRef: MatDialogRef<any>
    // @ViewChild('listForm', { read: TemplateRef }) listForm:TemplateRef<any>;
    // @ViewChild(GenericFormComponent) genericForm  

    // @ViewChild('fieldsSelector', { read: TemplateRef }) fieldsSelector:TemplateRef<any>;
    // @ViewChild(DraggableItemsComponent) selectFields  
 
      async ngOnInit() {
        this.dataSource = await this.getListDataSource()
      }
    
   


      // async saveList(){
      //   this.userListData.SelectionDisplayField = this.selectedFields.map(field => {return field.title})
      //   this.dialogRef.close()
      //   await this.notificationsSetupService.saveList(this.userListData)
      //   // this.formDataSource = this.getFormDataSource()
      //   this.dataSource = await this.getListDataSource()
      // }


  
    async getListDataSource(){
      return {
        init: async (params: any) => {
          let notificationsUsersLists = await this.notificationsSetupService.getUsersLists();
          if (params.searchString) {
            notificationsUsersLists = notificationsUsersLists.filter(usersList => {
              return (usersList.Title.toLowerCase().includes(params.searchString.toLowerCase()) || usersList.Body?.toLowerCase().includes(params.searchString.toLowerCase()))  
            })
          }
          return Promise.resolve({
            dataView: {
              Context: {
                Name: '',
                Profile: { InternalID: 0 },
                ScreenSize: 'Landscape'
              },
              Type: 'Grid',
              Title: 'Notifications',
              Fields: [
                {
                  FieldID: 'ListName',
                  Type: 'TextBox',
                  Title: this.translate.instant("List Name"),
                  Mandatory: true,
                  ReadOnly: true
                },
                {
                  FieldID: 'ResourceListKey',
                  Type: 'TextBox',
                  Title: this.translate.instant("Type"),
                  Mandatory: true,
                  ReadOnly: true
                },
                {
                  FieldID: 'DisplayTitleField',
                  Type: 'TextBox',
                  Title: this.translate.instant("Title Field"),
                  Mandatory: false,
                  ReadOnly: true
                },
                {
                  FieldID: 'MappingResourceUUID',
                  Type: 'TextBox',
                  Title: this.translate.instant("Mapping Resource"),
                  Mandatory: false,
                  ReadOnly: true
                },
                {
                  FieldID: 'SelectionDisplayField',
                  Type: 'TextBox',
                  Title: this.translate.instant("Display Fields"),
                  Mandatory: false,
                  ReadOnly: true
                },
              ],
              Columns: [
                {
                  Width: 20
                },
                {
                  Width: 20
                },
                {
                  Width: 20
                },
                {
                  Width: 20
                },
                {
                  Width: 20
                }
              ],
  
              FrozenColumnsCount: 0,
              MinimumColumnWidth: 0
            },
            totalCount: notificationsUsersLists.length,
            items: notificationsUsersLists
          });
        },
        inputs: () => {
          return Promise.resolve(
            {
              pager: {
                type: 'scroll'
              },
              selectionType: 'multi'
            }
          );
        },
      } as IPepGenericListDataSource
    }

    actions: IPepGenericListActions = {
      get: async (data) => {
        const actions = [];
        if(data.rows.length >= 1) {
          actions.push({
            title: this.translate.instant("Delete"),
            handler: async (objs) => {
              await this.notificationsSetupService.deleteSendToList(objs.rows);
              this.dataSource = await this.getListDataSource();
            }
        });
        }
  
        return actions;
      }
    }

    createNewListSetup(){
      this.openDialog(UsersListSetupComponent,(res) => {
        if(res){
            debugger
        }
      });
    }
    selectFields(){
      this.openDialog(FieldSelectorComponent,(res) => {
        if(res){
          debugger
          console.log(res)
            
        }
    });
  }
      
    openDialog(comp: any, callBack, data = {}){
      let config = this.dialogService.getDialogConfig({}, 'inline');
          config.disableClose = false;
          config.height = '80%'; // THE EDIT MODAL WIDTH
          config.width = '50%'; // THE EDIT MODAL WIDTH
  
      let dialogRef: MatDialogRef<any> = this.dialogService.openDialog(comp, data, config);
     
      dialogRef.afterClosed().subscribe((value) => {
          if (value !== undefined && value !== null) {
             callBack(value);
          }
      });
  }
}