export type BankerStep = {
    currentProcess?: number;
    work: number[];
    finish: boolean[];
    action: string;
    allocated?: number[];
};

export class Banker {
    private resources: number[];
    private max: number[][];
    private allocation: number[][];
    private available: number[];
    private need: number[][];
    private numProcesses: number;
    private numResources: number;

    private steps: BankerStep[] = [];

    constructor(resources: number[], allocation: number[][], max: number[][]) {
        this.resources = [...resources];
        this.max = max.map((row) => [...row]);
        this.allocation = allocation.map((row) => [...row]);
        this.available = this.resources.map(
            (value, j) => value - allocation.reduce((acc, row) => acc + row[j], 0),
        );
        this.numProcesses = max.length;
        this.numResources = this.available.length;
        this.need = this.calculateNeed();
    }

    private calculateNeed() {
        return this.max.map((row, i) => row.map((value, j) => value - this.allocation[i][j]));
    }

    public isSafe(): boolean {
        const work = [...this.available];
        const finish = Array(this.numProcesses).fill(false);
        this.steps = [];

        this.steps.push({
            work: [...work],
            finish: [...finish],
            action: 'Initial state',
        });

        while (finish.some((value) => !value)) {
            let found = false; // Whether at least one process was found to be completable

            for (let i = 0; i < this.numProcesses; i++) {
                if (!finish[i] && this.need[i].every((value, j) => value <= work[j])) {
                    finish[i] = true;
                    found = true;

                    for (let j = 0; j < this.numResources; j++) {
                        work[j] += this.allocation[i][j];
                    }

                    this.steps.push({
                        currentProcess: i,
                        work: [...work],
                        finish: [...finish],
                        action: `Complete P${i}`,
                        allocated: [...this.allocation[i]],
                    });

                    break;
                }
            }

            if (!found) {
                this.steps.push({
                    work: [...work],
                    finish: [...finish],
                    action: 'Deadlock detected',
                });
                return false;
            }
        }

        this.steps.push({
            work: [...work],
            finish: [...finish],
            action: 'Safe state',
        });
        return true;
    }

    public requestResources(processId: number, request: number[]): boolean {
        if (processId < 0 || processId >= this.numProcesses) {
            throw new Error(`Invalid process ID: ${processId}`);
        }
        if (request.length !== this.numResources) {
            throw new Error(`Invalid request format, expected ${this.numResources} resources`);
        }
        if (
            request.some((value, i) => value > this.need[processId][i]) ||
            request.some((value, i) => value > this.available[i])
        ) {
            return false;
        }

        for (let i = 0; i < this.numResources; i++) {
            this.available[i] -= request[i];
            this.allocation[processId][i] += request[i];
            this.need[processId][i] -= request[i];
        }

        if (!this.isSafe()) {
            // Roll back resource allocation
            for (let i = 0; i < this.numResources; i++) {
                this.available[i] += request[i];
                this.allocation[processId][i] -= request[i];
                this.need[processId][i] += request[i];
            }

            return false;
        }

        return true;
    }

    public findSafeSequence(): number[] {
        const work = [...this.available];
        const finish = Array(this.numProcesses).fill(false);
        const safeSequence: number[] = [];
        this.steps = [];

        this.steps.push({
            work: [...work],
            finish: [...finish],
            action: 'Initial state',
        });

        while (finish.some((value) => !value)) {
            let found = false; // Whether at least one process was found to be completable

            for (let i = 0; i < this.numProcesses; i++) {
                if (!finish[i] && this.need[i].every((value, j) => value <= work[j])) {
                    finish[i] = true;
                    found = true;
                    safeSequence.push(i);

                    for (let j = 0; j < this.numResources; j++) {
                        work[j] += this.allocation[i][j];
                    }

                    this.steps.push({
                        currentProcess: i,
                        work: [...work],
                        finish: [...finish],
                        action: `Complete P${i}`,
                        allocated: [...this.allocation[i]],
                    });

                    break;
                }
            }

            if (!found) {
                this.steps.push({
                    work: [...work],
                    finish: [...finish],
                    action: 'Deadlock detected',
                });
                return [];
            }
        }

        this.steps.push({
            work: [...work],
            finish: [...finish],
            action: 'Safe state',
        });
        return safeSequence;
    }

    public getState(): {
        allocation: number[][];
        max: number[][];
        available: number[];
        need: number[][];
    } {
        return {
            allocation: this.allocation.map((row) => [...row]),
            max: this.max.map((row) => [...row]),
            available: [...this.available],
            need: this.need.map((row) => [...row]),
        };
    }

    public getSteps(): BankerStep[] {
        return this.steps;
    }
}
