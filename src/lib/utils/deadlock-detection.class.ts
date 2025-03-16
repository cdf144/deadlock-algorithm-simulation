export class DeadlockDetection {
    private allocation: number[][];
    private request: number[][];
    private available: number[];
    private numProcesses: number;
    private numResources: number;

    private steps: {
        currentProcess?: number;
        work: number[];
        finish: boolean[];
        action: string;
        allocated?: number[];
    }[] = [];

    constructor(allocation: number[][], request: number[][], available: number[]) {
        this.allocation = allocation.map((row) => [...row]);
        this.request = request.map((row) => [...row]);
        this.available = [...available];
        this.numProcesses = request.length;
        this.numResources = available.length;
    }

    public isDeadlocked(): boolean {
        const work = [...this.available];
        const finish = Array(this.numProcesses).fill(false);
        this.steps = [];

        for (let i = 0; i < this.numProcesses; i++) {
            if (this.allocation[i].every((value) => value === 0)) {
                finish[i] = true;
            }
        }

        this.steps.push({
            work: [...work],
            finish: [...finish],
            action: 'Initial state',
        });

        while (finish.some((value) => !value)) {
            let found = false; // Whether at least one process was found to be completable

            for (let i = 0; i < this.numProcesses; i++) {
                if (!finish[i] && this.request[i].every((value, j) => value <= work[j])) {
                    finish[i] = true;
                    found = true;

                    for (let j = 0; j < this.numResources; j++) {
                        work[j] += this.allocation[i][j];
                    }

                    this.steps.push({
                        currentProcess: i,
                        work: [...work],
                        finish: [...finish],
                        action: `Process ${i} completed`,
                        allocated: this.allocation[i],
                    });
                }
            }

            if (!found) {
                this.steps.push({
                    work: [...work],
                    finish: [...finish],
                    action: 'Deadlock detected',
                });
                return true;
            }
        }

        this.steps.push({
            work: [...work],
            finish: [...finish],
            action: 'No deadlock detected',
        });
        return false;
    }

    public getDeadlockedProcesses(): number[] {
        const work = [...this.available];
        const finish = Array(this.numProcesses).fill(false);
        this.steps = [];

        for (let i = 0; i < this.numProcesses; i++) {
            if (this.allocation[i].every((value) => value === 0)) {
                finish[i] = true;
            }
        }

        this.steps.push({
            work: [...work],
            finish: [...finish],
            action: 'Initial state',
        });

        while (finish.some((value) => !value)) {
            let found = false; // Whether at least one process was found to be completable

            for (let i = 0; i < this.numProcesses; i++) {
                if (!finish[i] && this.request[i].every((value, j) => value <= work[j])) {
                    finish[i] = true;
                    found = true;

                    for (let j = 0; j < this.numResources; j++) {
                        work[j] += this.allocation[i][j];
                    }

                    this.steps.push({
                        currentProcess: i,
                        work: [...work],
                        finish: [...finish],
                        action: `Process ${i} completed`,
                        allocated: this.allocation[i],
                    });
                }
            }

            if (!found) {
                this.steps.push({
                    work: [...work],
                    finish: [...finish],
                    action: 'Deadlock detected',
                });
                return finish.map((value, i) => (value ? -1 : i)).filter((value) => value !== -1);
            }
        }

        this.steps.push({
            work: [...work],
            finish: [...finish],
            action: 'No deadlock detected',
        });
        return [];
    }

    public getState(): {
        allocation: number[][];
        request: number[][];
        available: number[];
    } {
        return {
            allocation: this.allocation.map((row) => [...row]),
            request: this.request.map((row) => [...row]),
            available: [...this.available],
        };
    }

    public getSteps() {
        return this.steps;
    }
}
