import { deepCopyMatrix } from '../deep-copy-matrix.util';

export type DeadlockDetectionStep = {
    currentProcess?: number;
    work: number[];
    finish: boolean[];
    action: string;
    allocated?: number[];
};

export class DeadlockDetection {
    private allocation: number[][];
    private request: number[][];
    private available: number[];
    private numProcesses: number;
    private numResources: number;

    // For displaying steps in the UI
    private steps: DeadlockDetectionStep[] = [];

    constructor(allocation: number[][], request: number[][], available: number[]) {
        this.allocation = deepCopyMatrix(allocation);
        this.request = deepCopyMatrix(request);
        this.available = [...available];
        this.numProcesses = request.length;
        this.numResources = available.length;
    }

    /**
     * Records the current state as a step in the algorithm
     */
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
            // Deep copy the allocated resources to prevent mutation
            allocated: allocated ? [...allocated] : undefined,
        });
    }

    /**
     * Checks if the system is currently in a deadlock state
     */
    public isDeadlocked(): boolean {
        const work = [...this.available];
        const finish = this.initializeFinishArray();
        this.steps = [];

        this.recordStep(work, finish, 'Initial state');

        while (finish.some((value) => !value)) {
            const processIndex = this.findNextCompletableProcess(work, finish);

            if (processIndex === -1) {
                this.recordStep(work, finish, 'Deadlock detected');
                return true;
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

        this.recordStep(work, finish, 'No deadlock detected');
        return false;
    }

    /**
     * @returns A boolean array indicating whether each process has finished. Processes that have
     *          no allocated resources are considered finished, otherwise they are not.
     */
    private initializeFinishArray(): boolean[] {
        const finish = Array(this.numProcesses).fill(false);

        for (let i = 0; i < this.numProcesses; i++) {
            if (this.allocation[i].every((value) => value === 0)) {
                finish[i] = true;
            }
        }

        return finish;
    }

    private canProcessComplete(processIndex: number, work: number[]): boolean {
        return this.request[processIndex].every((value, j) => value <= work[j]);
    }

    private releaseResources(processIndex: number, work: number[]): void {
        for (let j = 0; j < this.numResources; j++) {
            work[j] += this.allocation[processIndex][j];
        }
    }

    /**
     * @returns The index of the next completable process, or -1 if none can complete
     */
    private findNextCompletableProcess(work: number[], finish: boolean[]): number {
        for (let i = 0; i < this.numProcesses; i++) {
            if (!finish[i] && this.canProcessComplete(i, work)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Identifies which processes are involved in a deadlock
     * @returns An array of process indices that are deadlocked, or an empty array if no deadlock
     *          exists
     */
    public getDeadlockedProcesses(): number[] {
        const work = [...this.available];
        const finish = this.initializeFinishArray();
        this.steps = [];

        this.recordStep(work, finish, 'Initial state');

        while (finish.some((value) => !value)) {
            const processIndex = this.findNextCompletableProcess(work, finish);

            if (processIndex === -1) {
                this.recordStep(work, finish, 'Deadlock detected');
                return finish.map((value, i) => (value ? -1 : i)).filter((value) => value !== -1);
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

        this.recordStep(work, finish, 'No deadlock detected');
        return [];
    }

    /**
     * @returns The current state of the algorithm, including the `allocation`, `request`, and
     *          `available` matrices
     */
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

    /**
     * @returns {DeadlockDetectionStep[]} The steps taken by the algorithm to reach the current state
     */
    public getSteps(): DeadlockDetectionStep[] {
        return this.steps;
    }
}
