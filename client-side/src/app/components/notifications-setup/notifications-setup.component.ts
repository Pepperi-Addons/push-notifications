import { Component, OnInit, ViewChild, TemplateRef,Inject, Injector} from '@angular/core';
import { IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AddonData,FormDataView } from '@pepperi-addons/papi-sdk';
import { NotificationsSetupService } from '../../services/notifications-setup.services';
import { config } from '../../addon.config';
import { MatDialogRef,MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog'; 
import { GenericFormComponent } from '@pepperi-addons/ngx-composite-lib/generic-form';
@Component({
  selector: 'app-notifications-setup',
  templateUrl: './notifications-setup.component.html',
  styleUrls: ['./notifications-setup.component.scss']
})

export class NotificationsSetupComponent implements OnInit {
    dataView:FormDataView
    formDataSource:AddonData ={}
    dialogData: any
    is_disabled: boolean = true
    constructor(    
        private injector: Injector,
        private translate: TranslateService,
        private notificationsSetupService: NotificationsSetupService,
        private addonService: AddonService,
        private route: ActivatedRoute,
        private router: Router,
        private dialogService: PepDialogService,
        ) {
          this.addonService.addonUUID = config.AddonUUID;
         }
    dialogRef: MatDialogRef<any>
    @ViewChild('listForm', { read: TemplateRef }) listForm:TemplateRef<any>;
    @ViewChild(GenericFormComponent) genericForm  
 
      async ngOnInit() {
        this.dataView = await this.getDataView()
        this.formDataSource = this.getFormDataSource()
      }
    
      cancel(){
        this.dialogRef.close()
      }

      saveList(){
        console.log('Save clicked')
        this.dialogRef.close()
      }
      
      async getSelectionResources(){
        let resources = []

        let res = await this.notificationsSetupService.getResourceList()
        res.map(resource => {
          resources.push({Key:resource,Value:resource})
        });
        return resources
      }

      async getResourceFields(resource ){
        let Fields = []
        let res = await this.notificationsSetupService.getResourceFields({Where:"Name = "+resource})
        res.map(field => {
          Fields.push({Key:field,Value:field})
        });
        return Fields
      }

      async getMappingCollections(resource ){
        let Fields = []
        let res = await this.notificationsSetupService.getMappingCollections({resource:resource})
        res.map(field => {
          Fields.push({Key:field,Value:field})
        });
        return Fields
      }
      dataSource: IPepGenericListDataSource = this.getListDataSource()


      getFormDataSource(){
        let fakeData: any =
          {AddGroupList:"",
          ResourceListKey:"",
          DisplayTitleField:"",
          MappingResourceUUID:"",
          UserReferenceField:'',
          }
        return fakeData
      }

      getListDataSource(){
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
                    Title: this.translate.instant("Display Field"),
                    Mandatory: false,
                    ReadOnly: true
                  },
                  {
                    FieldID: 'MappingResourceUUID',
                    Type: 'TextBox',
                    Title: this.translate.instant("Mapping Resource"),
                    Mandatory: false,
                    ReadOnly: true
                  }
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
      

      async valueChange($event){
        let selectionList:any = {}
        console.log($event.ApiName)
        if($event.ApiName == "ResourceListKey"){
          selectionList.ResourceListKey =  $event.Value
          this.formDataSource.ResourceListKey = selectionList.ResourceListKey
          this.dataView.Fields[3].ReadOnly = false
          this.dataView.Fields[3]["OptionalValues"]=await this.getResourceFields(this.formDataSource.ResourceListKey)
        }
        if($event.ApiName == "DisplayTitleField"){
          selectionList.DisplayTitleField = $event.Value
          this.formDataSource.DisplayTitleField = selectionList.DisplayTitleField
          this.dataView.Fields[4].ReadOnly = false
          this.dataView.Fields[4]["OptionalValues"]=await this.getMappingCollections(this.formDataSource.ResourceListKey)
        }
        if($event.ApiName == "MappingResourceUUID"){
          selectionList.MappingResourceUUID = $event.Value
          this.formDataSource.MappingResourceUUID = selectionList.MappingResourceUUID
          this.dataView.Fields[5].ReadOnly = false
        }

      // update the data view with the desired data
      this.dataView = JSON.parse(JSON.stringify(this.dataView))
      }

      fieldClick(){

      }

      async getDataView():Promise<FormDataView>{
        let dataView:FormDataView = {
          Type: "Form",
          Hidden: false,
          Columns: [],
          Context: {
            Object: {
              Resource: "transactions",
              InternalID: 0,
              Name: "Object Name"
            },
            Name: '',
            Profile: { },
            ScreenSize: 'Tablet'
          },
          Fields: [
            {
              FieldID: "AddGroupList",
              Type: "Separator",
              Title: "Add Group List",
              Mandatory: true,
              ReadOnly: true,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            },
            {
              FieldID: "ListName",
              Type: "TextBox",
              Title: "List Name",
              Mandatory: true,
              ReadOnly: false,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            },
            {
              FieldID: "ResourceListKey",
              Type: "ComboBox",
              Title: "Selection Resource List",
              Mandatory: true,
              ReadOnly:  false,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            },
            {
              FieldID: "DisplayTitleField",
              Type: "MapDataDropDown",
              Title: "Selection Display Title Field",
              Mandatory: true,
              ReadOnly: true,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            },
            {
              FieldID: "MappingResourceUUID",
              Type: "MapDataDropDown",
              Title: "Choose Mapping Resource",
              Mandatory: true,
              ReadOnly: true,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            },
            {
              FieldID: "UserReferenceField",
              Type: "MapDataDropDown",
              Title: "User Reference Field",
              Mandatory: true,
              ReadOnly: true,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            }
          ],
          Rows: []
        }
        dataView.Fields[2]["OptionalValues"] = await this.getSelectionResources()
        return dataView
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

      addList(){
        this.dialogRef = this.dialogService.openDialog(this.listForm,'',{disableClose:false, height: '50%',
        width: '80%'})
        this.dialogData = this.injector.get(MAT_DIALOG_DATA, null)
      }
      
}