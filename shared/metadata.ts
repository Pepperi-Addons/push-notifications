import { FormDataView } from "@pepperi-addons/papi-sdk";

export const defaultFormViewForListSetup: FormDataView = {
    Type: "Form",
    Hidden: false,
    Columns: [],
    Context: {
      Object: {
        Resource: "None",
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
        FieldID: "ResourceNameDesc",
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
        FieldID: "ResourceName",
        Type: "ComboBox",
        Title: "Selection Resource List",
        Mandatory: true,
        ReadOnly:  true,
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
        FieldID: "TitleFieldDesc",
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
        FieldID: "TitleField",
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
        FieldID: "MappingResourceNameDesc",
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
        FieldID: "MappingResourceName",
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
      },
      {
        FieldID: "ResourceReferenceFieldDesc",
        Type: "RichTextHTML",
        Title: "",
        Mandatory: false,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: 11
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
        FieldID: "ResourceReferenceField",
        Type: "MapDataDropDown",
        Title: "Resource Reference Field",
        Mandatory: true,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: 12
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
        FieldID: "DisplayFieldsSelectorDesc",
        Type: "RichTextHTML",
        Title: "",
        Mandatory: true,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: 13
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
        FieldID: "DisplayFieldsSelector",
        Type: "Button",
        Title: "Select Fields To Display When Selecting Groups For Sending Notifications",
        Mandatory: true,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: 14
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

export const defaultDataSourceForListSetup = {
    ListNameDesc:"<p>Please insert list name</p>",
    ListName:"",
    ResourceNameDesc:"<p>Select A Resource for group selection</p>",
    ResourceName:"",
    TitleFieldDesc:"<p>Please select the field that will use as the display title in the 'To'"
    +" element of the message composer</p>",
    TitleField:"",
    MappingResourceNameDesc:"<p> Collections that contain a reference field to a User resource and a reference field"
    +" to <br> the selection list chosen above are available in this dropdown</p>",
    MappingResourceName:"",
    UserReferenceFieldDesc:"<p> Please select the field that references user resource in the mapping"
    +" resource <br> if there is only one field available it will be selected automatically </p>",
    UserReferenceField:'',
    ResourceReferenceFieldDesc:"<p> Please select the field that references the selected resource in the mapping"
    +" resource <br> if there is only one field available it will be selected automatically </p>",
    ResourceReferenceField:'',
    DisplayFieldsSelectorDesc: '<p> Display Fields Selection in Notifications Sending </p>',
    DisplayFieldsSelector: 'Press To Select Fields To Display'
}