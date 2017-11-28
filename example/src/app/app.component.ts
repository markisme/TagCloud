import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { TagCloud, Word, Options } from "d3-tagcloud";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  tagCloud: TagCloud;
  @ViewChild('cloud') cloudEle: ElementRef;

  ngOnInit() {
    this.tagCloud = new TagCloud(this.cloudEle.nativeElement);
    let options: Options = {
      orientation: 'multiple' //  default is 'right angled','single','right angled','multiple'
    }
    this.tagCloud.setOptions(options);
    let tags: Word[] = [
      { value: Math.ceil(Math.random() * 20), text: 'Word1' },
      { value: Math.ceil(Math.random() * 20), text: 'Word2' },
      { value: Math.ceil(Math.random() * 20), text: 'Word3' },
      { value: Math.ceil(Math.random() * 20), text: 'Word4' },
      { value: Math.ceil(Math.random() * 20), text: 'Word5' },
      { value: Math.ceil(Math.random() * 20), text: 'Word1' },
      { value: Math.ceil(Math.random() * 20), text: 'Word1' },
      { value: Math.ceil(Math.random() * 20), text: 'Word1' },
      { value: Math.ceil(Math.random() * 20), text: 'Word1' },
      { value: Math.ceil(Math.random() * 20), text: 'Word1' },
      { value: Math.ceil(Math.random() * 20), text: 'Word1' },
      { value: Math.ceil(Math.random() * 20), text: 'Word1' },
      { value: Math.ceil(Math.random() * 20), text: 'Word2' },
      { value: Math.ceil(Math.random() * 20), text: 'Word3' },
      { value: Math.ceil(Math.random() * 20), text: 'Word4' },
      { value: Math.ceil(Math.random() * 20), text: 'Word5' },
      { value: Math.ceil(Math.random() * 20), text: 'Word2' },
      { value: Math.ceil(Math.random() * 20), text: 'Word3' },
      { value: Math.ceil(Math.random() * 20), text: 'Word4' },
      { value: Math.ceil(Math.random() * 20), text: 'Word5' },
      { value: Math.ceil(Math.random() * 20), text: 'Word2' },
      { value: Math.ceil(Math.random() * 20), text: 'Word3' },
      { value: Math.ceil(Math.random() * 20), text: 'Word4' },
      { value: Math.ceil(Math.random() * 20), text: 'Word5' },
      { value: Math.ceil(Math.random() * 20), text: 'Word2' },
      { value: Math.ceil(Math.random() * 20), text: 'Word3' },
      { value: Math.ceil(Math.random() * 20), text: 'Word4' },
      { value: Math.ceil(Math.random() * 20), text: 'Word5' },
      { value: Math.ceil(Math.random() * 20), text: 'Word2' },
      { value: Math.ceil(Math.random() * 20), text: 'Word3' },
      { value: Math.ceil(Math.random() * 20), text: 'Word4' },
      { value: Math.ceil(Math.random() * 20), text: 'Word5' },
      { value: Math.ceil(Math.random() * 20), text: 'Word2' },
      { value: Math.ceil(Math.random() * 20), text: 'Word3' },
      { value: Math.ceil(Math.random() * 20), text: 'Word4' },
      { value: Math.ceil(Math.random() * 20), text: 'Word5' },
      { value: Math.ceil(Math.random() * 20), text: 'Word2' },
      { value: Math.ceil(Math.random() * 20), text: 'Word3' },
      { value: Math.ceil(Math.random() * 20), text: 'Word4' },
      { value: Math.ceil(Math.random() * 20), text: 'Word5' },
    ];
    this.tagCloud.setData(tags);
  }

}
