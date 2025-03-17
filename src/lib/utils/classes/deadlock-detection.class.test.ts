import { describe, it, expect, beforeEach } from 'vitest';
import { DeadlockDetection } from './deadlock-detection.class';
import { deepCopyMatrix } from '../deep-copy-matrix.util';

describe('DeadlockDetection', () => {
    let detection: DeadlockDetection;
    let allocation: number[][];
    let request: number[][];
    let available: number[];

    beforeEach(() => {
        allocation = [
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 3],
            [2, 1, 1],
            [0, 0, 2],
        ];
        request = [
            [0, 0, 0],
            [2, 0, 2],
            [0, 0, 0],
            [1, 0, 0],
            [0, 0, 2],
        ];
        available = [0, 0, 0];
        detection = new DeadlockDetection(allocation, request, available);
    });

    it('should initialize correctly', () => {
        const state = detection.getState();
        expect(state.allocation).toEqual(allocation);
        expect(state.request).toEqual(request);
        expect(state.available).toEqual(available);
    });

    it('should correctly detect no deadlock', () => {
        expect(detection.isDeadlocked()).toBe(false);

        const steps = detection.getSteps();
        expect(steps.length).toBeGreaterThan(0);
        expect(steps[0].action).toBe('Initial state');
        expect(steps[steps.length - 1].action).toBe('No deadlock detected');
    });

    it('should correctly detect deadlock', () => {
        // Modify original request to create a deadlock
        const deadlockRequest = deepCopyMatrix(request);
        deadlockRequest[2][2] = 1;

        const detection = new DeadlockDetection(allocation, deadlockRequest, available);
        expect(detection.isDeadlocked()).toBe(true);

        const steps = detection.getSteps();
        expect(steps[steps.length - 1].action).toBe('Deadlock detected');
    });

    it('should correctly identify deadlocked processes', () => {
        const allocation = [
            [1, 0, 2, 1],
            [2, 0, 1, 1],
            [0, 1, 0, 0],
            [1, 0, 1, 0],
            [0, 0, 0, 0],
            [2, 1, 1, 0],
        ];
        const deadlockRequest = [
            [0, 3, 0, 0],
            [0, 3, 1, 0],
            [3, 0, 0, 1],
            [0, 2, 0, 0],
            [2, 0, 0, 0],
            [0, 0, 0, 4],
        ];
        const available = [1, 2, 0, 3];

        const deadlockDetection = new DeadlockDetection(allocation, deadlockRequest, available);
        expect(deadlockDetection.isDeadlocked()).toBe(true);

        const deadlockedProcesses = deadlockDetection.getDeadlockedProcesses();
        expect(deadlockedProcesses).toContain(0);
        expect(deadlockedProcesses).toContain(1);
        expect(deadlockedProcesses).toContain(2);
        expect(deadlockedProcesses).toContain(5);
        expect(deadlockedProcesses).not.toContain(3);
        expect(deadlockedProcesses).not.toContain(4);
        expect(deadlockedProcesses.length).toBe(4);
    });

    it('should maintain correct state after algorithm execution', () => {
        detection.isDeadlocked();

        const state = detection.getState();
        expect(state.allocation).toEqual(allocation);
        expect(state.request).toEqual(request);
        expect(state.available).toEqual(available);
    });

    it('should return empty array for no deadlocked processes', () => {
        const deadlockedProcesses = detection.getDeadlockedProcesses();
        expect(deadlockedProcesses).toEqual([]);
    });

    it('should record steps correctly during algorithm execution', () => {
        detection.isDeadlocked();
        const steps = detection.getSteps();

        expect(steps.length).toBeGreaterThan(0);

        // Check that each step has the required properties
        steps.forEach((step) => {
            expect(step).toHaveProperty('work');
            expect(step).toHaveProperty('finish');
            expect(step).toHaveProperty('action');
        });

        // Check for completion steps
        const completionSteps = steps.filter(
            (step) =>
                step.action.startsWith('Complete P') &&
                step.currentProcess !== undefined &&
                step.allocated !== undefined,
        );

        expect(completionSteps.length).toBeGreaterThan(0);
    });

    it('should mark processes with zero allocation as finished', () => {
        const zeroAllocationMatrix = [
            [0, 0, 0],
            [1, 0, 1],
            [0, 0, 0],
            [0, 0, 0],
            [0, 1, 0],
        ];
        const requestMatrix = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
            [0, 1, 0],
            [1, 0, 0],
        ];
        const availableResources = [1, 1, 1];

        const detection = new DeadlockDetection(
            zeroAllocationMatrix,
            requestMatrix,
            availableResources,
        );
        const result = detection.isDeadlocked();

        expect(result).toBe(false);

        const steps = detection.getSteps();
        const initialStep = steps[0];

        expect(initialStep.finish[0]).toBe(true);
    });
});
