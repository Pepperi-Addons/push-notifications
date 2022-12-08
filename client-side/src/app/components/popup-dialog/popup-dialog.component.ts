import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-popup-dialog',
  templateUrl: './popup-dialog.component.html',
  styleUrls: ['./popup-dialog.component.css']
})
export class PopupDialogComponent implements OnInit {

  message: any;
  title: string;
  bottomButtonText: string;

  constructor(
    public dialogRef: MatDialogRef<PopupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public incoming: any
  ) { 
    this.message = incoming.data.Message;
    this.title = incoming.data.Title;
    this.bottomButtonText = incoming.data.ButtonText;
  }

  ngOnInit() {
  }

  onCloseFormClicked() {
    debugger;
    this.dialogRef.close();
  }

}
