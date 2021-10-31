export class FreezeSelect {
  count = 0;
  isFreeze = false;

  increaseCount() {
    ++this.count;
  }

  precessFreeze(isReadyToProcess) {
    if (isReadyToProcess) {
      this.increaseCount();

      if (this.count === 2) {
        this.isFreeze = true;
      }

      if (this.count === 3) {
        this.count = 1;
        this.isFreeze = false;
      }
    }
  }
}