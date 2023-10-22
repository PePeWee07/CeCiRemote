import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);
  constructor() {}

 async ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
    const { value } = await Preferences.get({ key: 'ipDefault' });
      console.log('ipDefault: ', value);
  }

  easterEggClickCount = 0;

//Ayuda a resetear las ip para tomar las de por defecto
  handleEasterEggClick() {
    this.easterEggClickCount++;

    if (this.easterEggClickCount === 5) {
      this.showSecretButton = true;
      this.easterEggClickCount = 0;
    }
  }
  showSecretButton = false;

  async deleteStorage(){
    await Preferences.remove({ key: "ipDefault" });
  }
}
