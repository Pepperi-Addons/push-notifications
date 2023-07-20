import { Component, OnInit, ViewChild, TemplateRef,Inject, Injector} from '@angular/core';
import { IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { AddonData,FormDataView } from '@pepperi-addons/papi-sdk';
import { NotificationsSetupService } from '../../services/notifications-setup.services';
import { config } from '../../addon.config';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog'; 
import { GenericFormComponent } from '@pepperi-addons/ngx-composite-lib/generic-form';
import { DraggableItemsComponent, IPepDraggableItem } from '@pepperi-addons/ngx-lib/draggable-items';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-notifications-setup',
  templateUrl: './notifications-setup.component.html',
  styleUrls: ['./notifications-setup.component.scss']
})

export class NotificationsSetupComponent implements OnInit {
    dataView:FormDataView
    formDataSource:AddonData ={}
    userListData:AddonData={}
    dialogData: any
    selectedFields: IPepDraggableItem[] = []
    isSaveListDisabled: boolean = true
    cancelDropArea = []
    selectDropArea = []
    fieldsToSelect: IPepDraggableItem[] = []
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
    @ViewChild('listForm', { read: TemplateRef }) listForm:TemplateRef<any>;
    @ViewChild(GenericFormComponent) genericForm  

    @ViewChild('fieldsSelector', { read: TemplateRef }) fieldsSelector:TemplateRef<any>;
    @ViewChild(DraggableItemsComponent) selectFields  
 
      async ngOnInit() {
        this.dataView = await this.getDataView()
        this.formDataSource = this.getFormDataSource()
        this.dataSource = await this.getListDataSource()
      }
    
      cancel(){
        this.formDataSource=this.getFormDataSource()
        this.dialogRef.close()
      }

      openFieldSelection(){
        this.userListData.ListName = this.formDataSource.ListName
        this.userListData.ResourceListKey = this.formDataSource.ResourceListKey
        this.userListData.DisplayTitleField = this.formDataSource.DisplayTitleField
        this.userListData.MappingResourceUUID = this.formDataSource.MappingResourceUUID
        this.userListData.UserReferenceField = this.formDataSource.UserReferenceField
        this.dialogRef.close()
        this.openFieldSelector()
        // this.formDataSource=this.getFormDataSource()

      }

      async saveList(){
        this.userListData.SelectionDisplayFields = this.selectedFields.map(field => {return field.title})
        this.dialogRef.close()
        await this.notificationsSetupService.saveList(this.userListData)
        this.formDataSource = this.getFormDataSource()
        this.dataSource = await this.getListDataSource()
      }



      openFieldSelector(){
        this.dialogRef = this.dialogService.openDialog(this.fieldsSelector,'',{disableClose:false, height: '50%',
        width: '50%'})
        this.dialogData = this.injector.get(MAT_DIALOG_DATA, null)
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
      async getUserReferenceFields(resource ){
        let Fields = []
        let res = await this.notificationsSetupService.getUserReferenceFields({Where:"Name = "+resource})
        res.map(field => {
          Fields.push({Key:field,Value:field})
        });
        return Fields
      }

      getFormDataSource(){
        let defaultData: any =
          {
          ListNameDesc:"<p>Please insert list name</p>",
          ListName:"",
          ResourceListKeyDesc:"<p>Select A Resource for group selection</p>",
          ResourceListKey:"",
          DisplayTitleFieldDesc:"<p>Please select the field that will use as the display title in the 'To'"
          +" element of the message composer</p>",
          DisplayTitleField:"",
          MappingResourceDesc:"<p> Collections that contain a reference field to a User resource and a reference field"
          +" to <br> the selection list chosen above are available in this dropdown</p>",
          MappingResourceUUID:"",
          UserReferenceFieldDesc:"<p>Please select the field that references user resource in the mapping resource</p>",
          UserReferenceField:'',
          }
        return defaultData
      }

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
        if($event.ApiName == "ListName"){
          selectionList.ListName =  $event.Value
          this.formDataSource.ListName = selectionList.ListName
          this.dataView.Fields[4]["OptionalValues"] = await this.getSelectionResources()
          this.dataView.Fields[4].ReadOnly = false
        }
        if($event.ApiName == "ResourceListKey"){
          selectionList.ResourceListKey =  $event.Value
          this.formDataSource.ResourceListKey = selectionList.ResourceListKey
          this.dataView.Fields[6]["OptionalValues"]=await this.getResourceFields(this.formDataSource.ResourceListKey)
          this.dataView.Fields[6].ReadOnly = false
        }
        if($event.ApiName == "DisplayTitleField"){
          selectionList.DisplayTitleField = $event.Value
          this.formDataSource.DisplayTitleField = selectionList.DisplayTitleField
          this.dataView.Fields[8]["OptionalValues"]=await this.getMappingCollections(this.formDataSource.ResourceListKey)
          this.dataView.Fields[8].ReadOnly = false
        }
        if($event.ApiName == "MappingResourceUUID"){
          selectionList.MappingResourceUUID = $event.Value
          this.formDataSource.MappingResourceUUID = selectionList.MappingResourceUUID
          this.dataView.Fields[10]["OptionalValues"]=await this.getUserReferenceFields(this.formDataSource.MappingResourceUUID)
          await this.updateFieldsToSelect(this.formDataSource.ResourceListKey)
          this.dataView.Fields[10].ReadOnly = false
        }
        if($event.ApiName == "UserReferenceField"){
          selectionList.UserReferenceField = $event.Value
          this.formDataSource.UserReferenceField = selectionList.UserReferenceField
          this.isSaveListDisabled = false
        }

      // update the data view with the desired data
      this.dataView = JSON.parse(JSON.stringify(this.dataView))
      }

      fieldClick(){

      }

      async updateFieldsToSelect(resource){
        const fieldNames = await this.notificationsSetupService.getResourceFields({Where:"Name = "+resource})
        this.fieldsToSelect = fieldNames.map(field=>{
          return { title: field, data: field }
        })
        console.log(`Fields to select ${this.fieldsToSelect}`)
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
                  X: 0,
                  Y: 0
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
              FieldID: "ListNameDesc",
              Type: "RichTextHTML",
              Title: "",
              Mandatory: false,
              ReadOnly: true,
              Layout: {
                Origin: {
                  X: 0,
                  Y: 1
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
                  X: 0,
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
              FieldID: "ResourceListKeyDesc",
              Type: "RichTextHTML",
              Title: "",
              Mandatory: false,
              ReadOnly: true,
              Layout: {
                Origin: {
                  X: 0,
                  Y: 3
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
                  X: 0,
                  Y: 4
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
              FieldID: "DisplayTitleFieldDesc",
              Type: "RichTextHTML",
              Title: "",
              Mandatory: false,
              ReadOnly: true,
              Layout: {
                Origin: {
                  X: 0,
                  Y: 5
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
                  X: 0,
                  Y: 6
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
              FieldID: "MappingResourceDesc",
              Type: "RichTextHTML",
              Title: "",
              Mandatory: false,
              ReadOnly: true,
              Layout: {
                Origin: {
                  X: 0,
                  Y: 7
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
                  X: 0,
                  Y: 8
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
              FieldID: "UserReferenceFieldDesc",
              Type: "RichTextHTML",
              Title: "",
              Mandatory: false,
              ReadOnly: true,
              Layout: {
                Origin: {
                  X: 0,
                  Y: 9
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
                  X: 0,
                  Y: 10
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
        this.dialogRef = this.dialogService.openDialog(this.listForm,'',{disableClose:false, height: '80%',
        width: '50%'})
        this.dialogData = this.injector.get(MAT_DIALOG_DATA, null)
      }
      
      addSelected(event: CdkDragDrop<IPepDraggableItem[]>) {
        console.log(event)
        if (event.previousContainer === event.container) {
          moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      } else {
          const item = this.fieldsToSelect.find(item => item.title === event.item.data);
          console.log(item)
          this.selectedFields.push(item)
          this.fieldsToSelect = this.fieldsToSelect.filter(removedItem => removedItem.title != item.title)
          console.log(this.selectedFields)
      }
    }
    
    removeSelected(event: CdkDragDrop<IPepDraggableItem[]>){
      console.log(event)
        if (event.previousContainer === event.container) {
          moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      } else {
          const item = this.selectedFields.find(item => item.title === event.item.data);
          console.log(item)
          this.fieldsToSelect.push(item)
          console.log(this.fieldsToSelect)
          this.selectedFields = this.selectedFields.filter(removedItem => removedItem.title != item.title)
      }
    }
}