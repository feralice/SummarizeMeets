import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserIdService {
  private readonly STORAGE_KEY = 'summarize_meets_user_id';

  constructor() {
    this.initUserId();
  }

  private initUserId(): void {
    if (!this.getUserId()) {
      const newId = crypto.randomUUID();
      localStorage.setItem(this.STORAGE_KEY, newId);
    }
  }

  getUserId(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }
}
