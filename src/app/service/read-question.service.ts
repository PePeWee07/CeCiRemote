import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReadQuestionService {

  speechSynthesis: SpeechSynthesis;

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
  }

  speak(text: string): void {
    const utterance = new SpeechSynthesisUtterance(text);
    this.speechSynthesis.speak(utterance);
  }
}
