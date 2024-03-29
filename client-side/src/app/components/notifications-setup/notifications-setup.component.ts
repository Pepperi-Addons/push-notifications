import { Component, OnInit, Injector} from '@angular/core';
import { IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { NotificationsSetupService } from '../../services/notifications-setup.services';
import { config } from '../../addon.config';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog'; 
import { UsersListSetupComponent } from './users-list-setup/users-list-setup.component';
import { NotificationsDialogService } from 'src/app/services/dialog-service.services';

@Component({
  selector: 'app-notifications-setup',
  templateUrl: './notifications-setup.component.html',
  styleUrls: ['./notifications-setup.component.scss']
})

export class NotificationsSetupComponent implements OnInit {
    dialogData: any
    notificationsDialogService: NotificationsDialogService

    dataSource: IPepGenericListDataSource
    constructor(    
        protected injector: Injector,
        protected translate: TranslateService,
        protected notificationsSetupService: NotificationsSetupService,
        protected addonService: AddonService,
        protected dialogService: PepDialogService,
        ) {
          this.addonService.addonUUID = config.AddonUUID;
          this.notificationsDialogService = new NotificationsDialogService(this.dialogService)
         }
 
      async ngOnInit() {
        this.dataSource = await this.getListDataSource()
      }
  
    async getListDataSource(){
      return {
        init: async (params: any) => {
          let notificationsUsersLists = await this.notificationsSetupService.getUsersLists();
          // add spacing between the values in the the SelectionDisplayFields field https://pepperi.atlassian.net/browse/DI-25047
          notificationsUsersLists.forEach(list => {
            if(list.SelectionDisplayFields){
              // selection display fields contain types which we don't want to display, so filtering out the types
              list.SelectionDisplayFields = list.SelectionDisplayFields.map(field => {
                return field.FieldName
              })
              list.SelectionDisplayFields = list.SelectionDisplayFields.join(', ');
            }
          });
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
                  FieldID: 'ResourceName',
                  Type: 'TextBox',
                  Title: this.translate.instant("Type"),
                  Mandatory: true,
                  ReadOnly: true
                },
                {
                  FieldID: 'TitleField',
                  Type: 'TextBox',
                  Title: this.translate.instant("Title Field"),
                  Mandatory: false,
                  ReadOnly: true
                },
                {
                  FieldID: 'MappingResourceName',
                  Type: 'TextBox',
                  Title: this.translate.instant("Mapping Resource"),
                  Mandatory: false,
                  ReadOnly: true
                },
                {
                  FieldID: 'SelectionDisplayFields',
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
          return (
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
        if(data.rows.length == 1) {
          actions.push({
            title: this.translate.instant("Edit"),
            handler: async (objs) => {
              this.goToEditMode(objs.rows[0]);
            }
        });
        }
        return actions;
      }
    }
    
    goToEditMode(selectedListKey: string){
      this.createNewListSetup(selectedListKey)
    }



    // opens dialog to create the list, if a key is passed then the dialog opens in edit mode
    createNewListSetup(listKey?: string){
      this.notificationsDialogService.openDialog(UsersListSetupComponent,async (res) => {
        if(res){
          await this.notificationsSetupService.saveList(res)
          this.dataSource = await this.getListDataSource();
        }
      },listKey);
    } 
    
}