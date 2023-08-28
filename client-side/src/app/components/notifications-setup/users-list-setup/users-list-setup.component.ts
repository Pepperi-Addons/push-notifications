import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { AddonData, FormDataView } from '@pepperi-addons/papi-sdk';
import { AddonService } from 'src/app/services/addon.service';
import { NotificationsDialogService } from 'src/app/services/dialog-service.services';
import { FieldSelectorComponent } from '../field-selector/field-selector.component';
import { defaultFormViewForListSetup, defaultDataSourceForListSetup, setupListViewIndexes, UsersLists } from 'shared'
import { NotificationsSetupService } from 'src/app/services/notifications-setup.services';

@Component({
  selector: 'addon-users-list-setup',
  templateUrl: './users-list-setup.component.html',
  styleUrls: ['./users-list-setup.component.scss']
})
export class UsersListSetupComponent implements OnInit {
  dataView:FormDataView
  formDataSource:AddonData = {}
  userListData:AddonData = {}
  selectedResource: AddonData
  selectedMappingResource: AddonData
  availableResources: AddonData[]
  notificationsDialogService: NotificationsDialogService
  resourceFields: string[]
  selectedDisplayFields: string[]
  editMode: boolean = false
  existingList: UsersLists

  constructor(
    private dialogRef: MatDialogRef<any>,
    private translate: TranslateService,
    protected notificationsSetupService: NotificationsSetupService,
    private dialogService: PepDialogService,
    protected addonService: AddonService,
    @Inject(MAT_DIALOG_DATA) private editingListKey: string // if listKey is empty, we are in create mode, else we are in edit mode
    ) { 
      this.notificationsDialogService = new NotificationsDialogService(this.dialogService)
      this.editMode = this.editingListKey.length > 0
    }

  ngOnInit(): void {
    this.dataView = defaultFormViewForListSetup
    this.formDataSource = defaultDataSourceForListSetup
    this.loadAvailableResources().then( () =>{
      this.loadDataSource();
      this.refreshFormData()
    })
  }

  loadDataSource(): any {
    if(this.editMode){
      this.loadDataForEditMode()
    } else {
      this.formDataSource = defaultDataSourceForListSetup
    }
  }

  cancel(){
     this.dialogRef.close();
     this.editMode = false;
     this.editingListKey = ""
     this.formDataSource = defaultDataSourceForListSetup
     this.dataView = defaultFormViewForListSetup
  }

  done() {
    this.userListData.ListName = this.formDataSource.ListName
    this.userListData.ResourceName = this.formDataSource.ResourceName
    this.userListData.TitleField = this.formDataSource.TitleField
    this.userListData.MappingResourceName = this.formDataSource.MappingResourceName
    this.userListData.UserReferenceField = this.formDataSource.UserReferenceField
    this.userListData.ResourceReferenceField = this.formDataSource.ResourceReferenceField
    this.dialogRef.close(this.userListData)
  }

  get isSaveButtonEnabled(): boolean{
    let res = false;
    if(this.editMode) {
      // if we are in edit mode, we need to check if the user changed any of the fields
      res = this.userListData?.SelectionDisplayFields != this.existingList?.SelectionDisplayFields || this.userListData?.SmartSearchFields != this.existingList?.SmartSearchFields
    }
    else {
      res = this.formDataSource.ListName != "" && this.formDataSource.ResourceName != ""
      && this.formDataSource.TitleField != "" && this.formDataSource.MappingResourceName != ""
      && this.formDataSource.UserReferenceField != "" && this.formDataSource.ResourceReferenceField != ""
      && this.userListData.SelectionDisplayFields != undefined && this.userListData.SmartSearchFields != undefined
    }
    return res
  }

  async loadDataForEditMode(){
    this.existingList = await this.notificationsSetupService.getListByKey(this.editingListKey)
    // saving the key will update the existing list
    this.userListData.Key = this.existingList.Key
    // saving all of the data in the form display
    this.loadEditModeFormData(this.existingList)
    // loading fields to select in drag & drop
    this.loadResourceFields(this.existingList.ResourceName)
    // disabling all selection fields except the editable ones - display fields and smart search fields
    this.disableAllUneditableFields()
  }

  loadEditModeFormData(listData: UsersLists){
    this.formDataSource.ListName = listData.ListName
    this.formDataSource.ResourceName = listData.ResourceName
    this.formDataSource.TitleField = listData.TitleField
    this.formDataSource.MappingResourceName = listData.MappingResourceName
    this.formDataSource.UserReferenceField = listData.UserReferenceField
    this.formDataSource.ResourceReferenceField = listData.ResourceReferenceField
    // this two fields are not editable in the form data source (the data source is the button text) - they are only for the user list data
    this.userListData.SelectionDisplayFields = listData.SelectionDisplayFields
    this.userListData.SmartSearchFields = listData.SmartSearchFields
  }

  disableAllUneditableFields(){
    this.dataView.Fields[setupListViewIndexes.ListName].ReadOnly = true
    this.dataView.Fields[setupListViewIndexes.ResourceName].ReadOnly = true
    this.dataView.Fields[setupListViewIndexes.TitleField].ReadOnly = true
    this.dataView.Fields[setupListViewIndexes.MappingResourceName].ReadOnly = true
    this.dataView.Fields[setupListViewIndexes.UserReferenceField].ReadOnly = true
    this.dataView.Fields[setupListViewIndexes.ResourceReferenceField].ReadOnly = true
    this.dataView.Fields[setupListViewIndexes.DisplayFieldsSelector].ReadOnly = false
    this.dataView.Fields[setupListViewIndexes.SmartSearchFields].ReadOnly = false
    this.refreshFormData()
  }

  async valueChange($event){
    if($event.ApiName == "ListName"){ 
      this.validateListName($event.Value)
    }
    if($event.ApiName == "ResourceName"){
      this.validateResources($event.Value)
    }
    if($event.ApiName == "TitleField"){
      this.validateDisplayTitleField($event.Value)
    }
    if($event.ApiName == "MappingResourceName"){
      this.validateMappingResource($event.Value)
    }
    if($event.ApiName == "UserReferenceField"){
      this.validateUserReferenceField($event.Value)
    }
    if($event.ApiName == "ResourceReferenceField"){
      this.validateResourceReferenceField($event.Value)
    }

  // update the data view with the desired data
  this.refreshFormData()
  }

  async loadAvailableResources(): Promise<void>{
    const res = await this.addonService.papiClient.resources.resource('resources').get()
    this.availableResources = res
  }

  validateListName(listNameSelected: string){
    if(listNameSelected.length > 0){
      // saving the list name 
      this.formDataSource.ListName = listNameSelected
      // updating data in resource selection
      this.dataView.Fields[setupListViewIndexes.ResourceName]["OptionalValues"] = this.getSelectionResources()
      // enabling resource selection
      this.dataView.Fields[setupListViewIndexes.ResourceName].ReadOnly = false
    }
  }

  validateResources(resourceSelected: string){
    // validating that next fields are not selected, if resource is changed it affects
    // the rest of the fields
    this.formDataSource.TitleField = ""
    // resetting resource fields when resource is changed
    this.resourceFields = []
    // not setting display title to read only because it need to be selected next
    this.formDataSource.MappingResourceName = ""
    this.dataView.Fields[setupListViewIndexes.MappingResourceName].ReadOnly = true
    this.formDataSource.UserReferenceField = ""
    this.dataView.Fields[setupListViewIndexes.UserReferenceField].ReadOnly = true
    this.formDataSource.ResourceReferenceField = ""
    this.dataView.Fields[setupListViewIndexes.ResourceReferenceField].ReadOnly = true
    this.userListData.SelectionDisplayFields = undefined
    this.dataView.Fields[setupListViewIndexes.DisplayFieldsSelector].ReadOnly = true
    this.userListData.SmartSearchFields = undefined
    this.dataView.Fields[setupListViewIndexes.SmartSearchFields].ReadOnly = true
    // saving data from the form selection
    this.formDataSource.ResourceName = resourceSelected
    console.log(`selected resource is ${resourceSelected}`)
    // enabling selection of the next field and updating options to select
    this.dataView.Fields[setupListViewIndexes.TitleField]["OptionalValues"] = this.getResourceFields(resourceSelected)
    this.dataView.Fields[setupListViewIndexes.TitleField].ReadOnly = false
  }

  validateDisplayTitleField(displayTitleSelected: string){
    // saving the list name 
    this.formDataSource.TitleField = displayTitleSelected
    // updating data in mapping resource selection
    this.dataView.Fields[setupListViewIndexes.MappingResourceName]["OptionalValues"] = this.getMappingCollections(this.formDataSource.ResourceName)
    // enabling mapping resource selection
    this.dataView.Fields[setupListViewIndexes.MappingResourceName].ReadOnly = false
  }

  validateMappingResource(selectedMappingResource: string){
    // validating that next fields are not selected, if mapping is changed it affects
    // the reference fields selected
    this.formDataSource.UserReferenceField = ""
    this.dataView.Fields[setupListViewIndexes.UserReferenceField].ReadOnly = true
    this.formDataSource.ResourceReferenceField = ""
    this.dataView.Fields[setupListViewIndexes.ResourceReferenceField].ReadOnly = true
    // saving the mapping resource name
    this.formDataSource.MappingResourceName = selectedMappingResource
    // enabling selection of reference fields and populating data to be selected

    const userReferenceOptions =  this.getUserReferenceFields(this.getSelectedMappingResource(selectedMappingResource))

    this.dataView.Fields[setupListViewIndexes.UserReferenceField]["OptionalValues"] = userReferenceOptions

    if(userReferenceOptions.length == 1){
      this.formDataSource.UserReferenceField = userReferenceOptions[0].Key
      this.validateUserReferenceField(userReferenceOptions[0].Key)
    }
    else{
      // enabling user reference fields selection 
      this.dataView.Fields[setupListViewIndexes.UserReferenceField].ReadOnly = false
    }

  }
  validateResourceReferenceField(selectedResourceReferenceField: string){
    // saving the selected user reference field
    this.formDataSource.ResourceReferenceField = selectedResourceReferenceField
    // enabling display fields selection in drag and drop 
    this.dataView.Fields[setupListViewIndexes.DisplayFieldsSelector].ReadOnly = false
  }
  validateUserReferenceField(selectedUserReferenceField: string){
    // saving the selected user reference field
    this.formDataSource.UserReferenceField = selectedUserReferenceField

    const resourceReferenceOptions = this.getMappedResourceFields(this.getSelectedMappingResource(this.formDataSource.MappingResourceName), this.formDataSource.ResourceName)

    this.dataView.Fields[setupListViewIndexes.ResourceReferenceField]["OptionalValues"] = resourceReferenceOptions
    
    if(resourceReferenceOptions.length == 1){
      this.formDataSource.ResourceReferenceField = resourceReferenceOptions[0].Key
      this.validateResourceReferenceField(resourceReferenceOptions[0].Key)
    }
    else{
      // enabling display fields selection in drag and drop 
      this.dataView.Fields[setupListViewIndexes.ResourceReferenceField].ReadOnly = false
    }
  }

  validateSelectedDisplayFields(selectedDisplayFields: string[]){
    if(selectedDisplayFields.length == 0){
      throw new Error('Fields Must Be Selected!')
    }
    else{
      // saving selected fields
      this.userListData.SelectionDisplayFields = selectedDisplayFields
      this.dataView.Fields[setupListViewIndexes.SmartSearchFields].ReadOnly = false
      this.refreshFormData()
    }
  }

  validateSmartSearchFields(selectedSearchFields: string[]){
    if(selectedSearchFields.length == 0){
      throw new Error('Fields Must Be Selected!')
    }
    else{
      // saving selected fields
      this.userListData.SmartSearchFields = selectedSearchFields
    }
  }

  refreshFormData(){
    // refreshing because data view is not updated on its own
    this.dataView = JSON.parse(JSON.stringify(this.dataView))
  }

  fieldClick($event){
    if($event.ApiName == 'DisplayFieldsSelector'){
      this.notificationsDialogService.openDialog(FieldSelectorComponent,(res) => {
        if(res){
          this.validateSelectedDisplayFields(res)
        }
      },
      this.resourceFields)
    }
    if($event.ApiName == "SmartSearchFields"){
      this.notificationsDialogService.openDialog(FieldSelectorComponent,(res) => {
        if(res){
          this.validateSmartSearchFields(res)
        }
      },
      this.userListData.SelectionDisplayFields)
    }
  }
      
  getSelectionResources(): optionalValuesData[]{
    const resources = this.availableResources
    return resources.map(resource => {
      return {Key: resource.Name, Value: resource.Name} as optionalValuesData
    });
  }

  loadResourceFields(selectedResourceName: string){
    const resourceToSelect = this.availableResources.filter(resource => resource.Name === selectedResourceName)[0]
    const fields = [...Object.keys(resourceToSelect["Fields"])]
    this.resourceFields = fields
  }

  getResourceFields(selectedResourceName: string): optionalValuesData[] {
    if(!this.resourceFields || this.resourceFields.length == 0){
      this.loadResourceFields(selectedResourceName)
    }  
    return this.resourceFields.map(field=>{
      return {Key:field, Value:field} as optionalValuesData
    })
  }

  getMappingCollections(selectedResourceName: string): optionalValuesData[]{
    const mappingCollections: optionalValuesData[] = []
    this.availableResources.forEach(resource =>{
      const resourceField = this.getMappedResourceFields(resource, selectedResourceName)
      const userField = this.getUserReferenceFields(resource)
      if (resourceField.length > 0 && userField.length >0){
        mappingCollections.push({Key: resource.Name, Value: resource.Name})
      }
    })
    return mappingCollections
  }

  getMappedResourceFields(mappingResource, selectedResourceName): optionalValuesData[]{
    const mappedResourceFields: optionalValuesData[] = []
    Object.keys(mappingResource.Fields).forEach(key =>{
      if(mappingResource.Fields[key].Type == 'Resource' && mappingResource.Fields[key]["Resource"] == selectedResourceName){
        mappedResourceFields.push({Key: key, Value: key})
      }
    })
    return mappedResourceFields
  }

  getUserReferenceFields(mappingResource: AddonData): optionalValuesData[]{
    const mappedUserFields: optionalValuesData[] = []
    Object.keys(mappingResource.Fields).map(key =>{
      if(mappingResource.Fields[key].Type == 'Resource' && mappingResource.Fields[key]["Resource"] == 'users'){
        mappedUserFields.push({Key: key, Value: key})
      }
    })
    return mappedUserFields
  }

  getSelectedMappingResource(mappingResourceName: string){
    return this.availableResources.filter(resource => resource.Name === mappingResourceName)[0]
  }

}

export interface optionalValuesData {
  Key: string;
  Value: string;
}
