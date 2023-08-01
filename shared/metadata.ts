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
        FieldID: "DisplayFieldsSelectorDesc",
        Type: "RichTextHTML",
        Title: "",
        Mandatory: true,
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
        FieldID: "DisplayFieldsSelector",
        Type: "Button",
        Title: "Select Fields To Display When Selecting Groups For Sending Notifications",
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
    UserReferenceFieldDesc:"<p>Please select the field that references user resource in the mapping resource</p>",
    UserReferenceField:'',
    DisplayFieldsSelectorDesc: '<p> Display Fields Selection in Notifications Sending </p>',
    DisplayFieldsSelector: 'Press To Select Fields To Display'
}

export const UsersListDataView = {
  List: {
    Key: "Notifications_Users_List",
    Name: "Users list",
    Resource: "users",
    Views: [{
      Key: "notifications_users_view",
      Type: "Grid",
      Title: "Users",
      Blocks: [{
        Title: "Email",
        Configuration: {
            Type: "TextBox",
            FieldID: "Email",
            Width: 10
        }, 
      },
      {
        Title: "First Name",
        Configuration: {
            Type: "TextBox",
            FieldID: "FirstName",
            Width: 10
        },
      },
      {
        Title: "Last Name",
        Configuration: {
            Type: "TextBox",
            FieldID: "LastName",
            Width: 10
        },
      },
      {
        Title: "User UUID",
        Configuration: {
            Type: "TextBox",
            FieldID: "Key",
            Width: 10
        },
      }],
    }],
    SelectionType: "Multi",
    Search: {
      Fields: [
          {
              FieldID: "FirstName"
          },
          {
              FieldID: "LastName"
          },
          {
              FieldID: "Email"
          }
      ]
    },
    Sorting: {Ascending: true, FieldID: "FirstName"},     
  },
  State: {
    ListKey: "Notifications_Users_List",
  },          
}