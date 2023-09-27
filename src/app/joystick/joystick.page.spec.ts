import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoystickPage } from './joystick.page';

describe('JoystickPage', () => {
  let component: JoystickPage;
  let fixture: ComponentFixture<JoystickPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(JoystickPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
