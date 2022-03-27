import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-notification-block-editor',
  templateUrl: './notification-block-editor.component.html',
  styleUrls: ['./notification-block-editor.component.css']
})
export class NotificationBlockEditorComponent implements OnInit {

  constructor(private translate: TranslateService) { }

  ngOnInit() {
  }

}
