import { Component, ViewChild, ElementRef, OnInit,HostListener } from '@angular/core';
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
      orientation: 'right angled' //  default is 'right angled','single','right angled','multiple'
    }
    this.tagCloud.setOptions(options);
    let tags: Word[] = []
    for (let i = 0; i < 100; i++) {
      tags.push({ value: ~~(Math.random() * 10000)/100, text: 'Test Word' + i })
    }
    this.tagCloud.setData(tags);
  }
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.tagCloud.resize();
  }
}
