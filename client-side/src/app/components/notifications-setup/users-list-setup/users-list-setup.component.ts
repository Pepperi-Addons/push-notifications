import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { AddonData, FormDataView } from '@pepperi-addons/papi-sdk';
import { AddonService } from 'src/app/services/addon.service';
import { NotificationsDialogService } from 'src/app/services/dialog-service.services';
import { FieldSelectorComponent } from '../field-selector/field-selector.component';
import { defaultFormViewForListSetup, defaultDataSourceForListSetup } from 'shared'

@Component({
  selector: 'addon-users-list-setup',
  templateUrl: './users-list-setup.component.html',
  styleUrls: ['./users-list-setup.component.scss']
})
export class UsersListSetupComponent implements OnInit {
  dataView:FormDataView
  formDataSource:AddonData = {}
  userListData:AddonData = {}
  isSaveListDisabled: boolean = true
  selectedResource: AddonData
  selectedMappingResource: AddonData
  availableResources: AddonData[]
  notificationsDialogService: NotificationsDialogService
  resourceFields: string[]
  selectedDisplayFields: string[]


  constructor(
    private dialogRef: MatDialogRef<any>,
    private translate: TranslateService,
    private dialogService: PepDialogService,
    protected addonService: AddonService
    ) { 
      this.notificationsDialogService = new NotificationsDialogService(this.dialogService)
    }

  ngOnInit(): void {
    this.dataView = defaultFormViewForListSetup
    this.formDataSource = defaultDataSourceForListSetup
    this.loadAvailableResources().then(
      resources => this.availableResources = resources)
  }


  cancel(){
     this.dialogRef.close();
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
    return this.formDataSource.ListName != "" && this.formDataSource.ResourceName != ""
    && this.formDataSource.TitleField != "" && this.formDataSource.MappingResourceName != ""
    && this.formDataSource.UserReferenceField != "" && this.formDataSource.ResourceReferenceField != ""
    && this.userListData.SelectionDisplayFields != undefined
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

  async loadAvailableResources(){
    return await this.addonService.papiClient.resources.resource('resources').get()
  }

  validateListName(listNameSelected: string){
    // saving the list name 
    this.formDataSource.ListName = listNameSelected
    // updating data in resource selection
    this.dataView.Fields[4]["OptionalValues"] = this.getSelectionResources()
    // enabling resource selection
    this.dataView.Fields[4].ReadOnly = false
  }

  validateResources(resourceSelected: string){
    // validating that next fields are not selected, if resource is changed it affects
    // the rest of the fields
    this.formDataSource.TitleField = ""
    // not setting display title to read only because it need to be selected next
    this.formDataSource.MappingResourceName = ""
    this.dataView.Fields[8].ReadOnly = true
    this.formDataSource.UserReferenceField = ""
    this.dataView.Fields[10].ReadOnly = true
    this.userListData.SelectionDisplayFields = undefined
    this.dataView.Fields[14].ReadOnly = true
    // saving data from the form selection
    this.formDataSource.ResourceName = resourceSelected
    // enabling selection of the next field and updating options to select
    this.dataView.Fields[6]["OptionalValues"] = this.getResourceFields(resourceSelected)
    this.dataView.Fields[6].ReadOnly = false
  }

  validateDisplayTitleField(displayTitleSelected: string){
    // saving the list name 
    this.formDataSource.TitleField = displayTitleSelected
    // updating data in mapping resource selection
    this.dataView.Fields[8]["OptionalValues"] = this.getMappingCollections(this.formDataSource.ResourceName)
    // enabling mapping resource selection
    this.dataView.Fields[8].ReadOnly = false
  }

  validateMappingResource(selectedMappingResource: string){
    // validating that next fields are not selected, if mapping is changed it affects
    // the reference fields selected
    this.formDataSource.UserReferenceField = ""
    this.formDataSource.ResourceReferenceField = ""
    this.dataView.Fields[12].ReadOnly = true
    // saving the mapping resource name
    this.formDataSource.MappingResourceName = selectedMappingResource
    // enabling selection of reference fields and populating data to be selected

    const userReferenceOptions =  this.getUserReferenceFields(this.getSelectedMappingResource(selectedMappingResource))

    this.dataView.Fields[10]["OptionalValues"] = userReferenceOptions

    if(userReferenceOptions.length == 1){
      this.formDataSource.UserReferenceField = userReferenceOptions[0].Key
      this.validateUserReferenceField(userReferenceOptions[0].Key)
    }
    // enabling display fields selection in drag and drop 
    this.dataView.Fields[10].ReadOnly = false
  }
  validateResourceReferenceField(selectedResourceReferenceField: string){
    // saving the selected user reference field
    this.formDataSource.ResourceReferenceField = selectedResourceReferenceField
    // enabling display fields selection in drag and drop 
    this.dataView.Fields[14].ReadOnly = false
  }
  validateUserReferenceField(selectedUserReferenceField: string){
    // saving the selected user reference field
    this.formDataSource.UserReferenceField = selectedUserReferenceField

    const resourceReferenceOptions = this.getMappedResourceFields(this.getSelectedMappingResource(this.formDataSource.MappingResourceName), this.formDataSource.ResourceName)

    this.dataView.Fields[12]["OptionalValues"] = resourceReferenceOptions
    
    if(resourceReferenceOptions.length == 1){
      this.formDataSource.ResourceReferenceField = resourceReferenceOptions[0].Key
      this.validateResourceReferenceField(resourceReferenceOptions[0].Key)
    }
    // enabling display fields selection in drag and drop 
    this.dataView.Fields[12].ReadOnly = false
    
  }

  validateSelectedDisplayFields(selectedDisplayFields: string[]){
    if(selectedDisplayFields.length == 0){
      throw new Error('Fields Must Be Selected!')
    }
    else{
      // saving selected fields
      this.userListData.SelectionDisplayFields = selectedDisplayFields
      // enabling saving the list
      this.isSaveListDisabled = false
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
  }
      
  getSelectionResources(): optionalValuesData[]{
    const resources = this.availableResources
    return resources.map(resource => {
      return {Key: resource.Name, Value: resource.Name} as optionalValuesData
    });
  }

  getResourceFields(selectedResourceName: string): optionalValuesData[]{
    const resourceToSelect = this.availableResources.filter(resource => resource.Name === selectedResourceName)[0]
    const fields = [...Object.keys(resourceToSelect["Fields"])]
    this.resourceFields = fields
    return fields.map(field=>{
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
