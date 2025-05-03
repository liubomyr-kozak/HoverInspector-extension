export class FreezeSelect {
    count = 0;
    isFreeze = false;
    isManualUnfreeze = false;

    increaseCount() {
        ++this.count;
    }

    precessFreeze(isReadyToProcess: any) {
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

    manualUnfreeze() {
        this.isFreeze = false;
        this.isManualUnfreeze = true;
    }

    manualFreeze() {
        this.isFreeze = true;
        this.isManualUnfreeze = false;
    }

    reset() {
        this.count = 0;
        this.isFreeze = false;
        this.isManualUnfreeze = false;
    }
}