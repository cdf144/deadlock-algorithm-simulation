import { deepCopyMatrix } from '../deep-copy-matrix.util';

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

    // For displaying steps in the UI
    private steps: BankerStep[] = [];

    constructor(resources: number[], allocation: number[][], max: number[][]) {
        this.resources = [...resources];
        this.max = deepCopyMatrix(max);
        this.allocation = deepCopyMatrix(allocation);

        this.numProcesses = max.length;
        this.numResources = resources.length;

        this.available = this.calculateAvailable(this.resources, this.allocation);
        this.need = this.calculateNeed(this.max, this.allocation);
    }

    /**
     * `available = resources - allocation`
     */
    private calculateAvailable(resources: number[], allocation: number[][]): number[] {
        return resources.map(
            (total, j) => total - allocation.reduce((sum, row) => sum + row[j], 0),
        );
    }

    /**
     * `need = max - allocation`
     */
    private calculateNeed(max: number[][], allocation: number[][]): number[][] {
        return max.map((row, i) => row.map((value, j) => value - allocation[i][j]));
    }

    private recordStep(
        work: number[],
        finish: boolean[],
        action: string,
        currentProcess?: number,
        allocated?: number[],
    ): void {
        this.steps.push({
            currentProcess,
            work: [...work],
            finish: [...finish],
            action,
            // Deep copy the allocated array if it is provided
            allocated: allocated ? [...allocated] : undefined,
        });
    }

    /**
     * Checks if the state provided is safe
     */
    public isSafe(): boolean {
        const work = [...this.available];
        const finish = Array(this.numProcesses).fill(false);
        this.steps = [];

        this.recordStep(work, finish, 'Initial state');

        while (finish.some((value) => !value)) {
            const processIndex = this.findNextCompletableProcess(work, finish);

            if (processIndex === -1) {
                this.recordStep(work, finish, 'Deadlock detected');
                return false;
            }

            finish[processIndex] = true;
            this.releaseResources(processIndex, work);

            this.recordStep(
                work,
                finish,
                `Complete P${processIndex}`,
                processIndex,
                this.allocation[processIndex],
            );
        }

        this.recordStep(work, finish, 'Safe state');
        return true;
    }

    /**
     * @returns The index of the next completable process, or -1 if no process can complete
     */
    private findNextCompletableProcess(work: number[], finish: boolean[]): number {
        for (let i = 0; i < this.numProcesses; i++) {
            if (!finish[i] && this.canProcessComplete(i, work)) {
                return i;
            }
        }
        return -1;
    }

    private canProcessComplete(processIndex: number, work: number[]): boolean {
        return this.need[processIndex].every((value, j) => value <= work[j]);
    }

    private releaseResources(processIndex: number, work: number[]): void {
        for (let j = 0; j < this.numResources; j++) {
            work[j] += this.allocation[processIndex][j];
        }
    }

    /**
     * Attempts to allocate requested resources to a process
     * @returns `true` if the request was granted, `false` if there is not enough available
     *          resources or the system is left in an unsafe state
     */
    public requestResources(processIndex: number, request: number[]): boolean {
        this.validateRequest(processIndex, request);

        if (!this.isRequestValid(processIndex, request)) {
            return false;
        }

        this.allocateResources(processIndex, request);

        if (!this.isSafe()) {
            this.rollbackAllocation(processIndex, request);
            return false;
        }

        return true;
    }

    /**
     * @throws An error if the process ID is invalid or the request format is incorrect
     */
    private validateRequest(processId: number, request: number[]): void {
        if (processId < 0 || processId >= this.numProcesses) {
            throw new Error(`Invalid process ID: ${processId}`);
        }
        if (request.length !== this.numResources) {
            throw new Error(`Invalid request format, expected ${this.numResources} resources`);
        }
    }

    /**
     * A request is valid if it does not exceed the `need` of the process or the `available`
     * resources
     */
    private isRequestValid(processId: number, request: number[]): boolean {
        return (
            !request.some((value, i) => value > this.need[processId][i]) &&
            !request.some((value, i) => value > this.available[i])
        );
    }

    private allocateResources(processId: number, request: number[]): void {
        for (let i = 0; i < this.numResources; i++) {
            this.available[i] -= request[i];
            this.allocation[processId][i] += request[i];
            this.need[processId][i] -= request[i];
        }
    }

    private rollbackAllocation(processId: number, request: number[]): void {
        for (let i = 0; i < this.numResources; i++) {
            this.available[i] += request[i];
            this.allocation[processId][i] -= request[i];
            this.need[processId][i] += request[i];
        }
    }

    /**
     * Finds a safe sequence of process execution
     * @returns A safe completion sequence of process indices, or an empty array if a deadlock is
     *          detected
     */
    public findSafeSequence(): number[] {
        const work = [...this.available];
        const finish = Array(this.numProcesses).fill(false);
        const safeSequence: number[] = [];
        this.steps = [];

        this.recordStep(work, finish, 'Initial state');

        while (finish.some((value) => !value)) {
            const processIndex = this.findNextCompletableProcess(work, finish);

            if (processIndex === -1) {
                this.recordStep(work, finish, 'Deadlock detected');
                return [];
            }

            finish[processIndex] = true;
            safeSequence.push(processIndex);
            this.releaseResources(processIndex, work);

            this.recordStep(
                work,
                finish,
                `Complete P${processIndex}`,
                processIndex,
                this.allocation[processIndex],
            );
        }

        this.recordStep(work, finish, 'Safe state');
        return safeSequence;
    }

    /**
     * @returns The current state of the algorithm, including the `allocation`, `max`, `available`,
     *          and `need` matrices
     */
    public getState(): {
        allocation: number[][];
        max: number[][];
        available: number[];
        need: number[][];
    } {
        return {
            allocation: deepCopyMatrix(this.allocation),
            max: deepCopyMatrix(this.max),
            available: [...this.available],
            need: deepCopyMatrix(this.need),
        };
    }

    /**
     * @returns {BankerStep[]} The steps taken by the algorithm to reach the current state
     */
    public getSteps(): BankerStep[] {
        return this.steps;
    }
}
