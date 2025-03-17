import { describe, it, expect, beforeEach } from 'vitest';
import { Banker } from './banker.class';

describe('Banker', () => {
    let banker: Banker;
    let resources: number[];
    let allocation: number[][];
    let max: number[][];

    beforeEach(() => {
        resources = [10, 5, 7];
        allocation = [
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2],
        ];
        max = [
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3],
        ];
        banker = new Banker(resources, allocation, max);
    });

    it('should initialize correctly', () => {
        const state = banker.getState();

        // A: 10 - (0+2+3+2+0) = 3
        // B: 5 - (1+0+0+1+0) = 3
        // C: 7 - (0+0+2+1+2) = 2
        expect(state.available).toEqual([3, 3, 2]);

        expect(state.need).toEqual([
            [7, 4, 3],
            [1, 2, 2],
            [6, 0, 0],
            [0, 1, 1],
            [4, 3, 1],
        ]);
    });

    it('should correctly detect a safe state', () => {
        expect(banker.isSafe()).toBe(true);

        const steps = banker.getSteps();
        expect(steps.length).toBeGreaterThan(0);
        expect(steps[0].action).toBe('Initial state');
        expect(steps[steps.length - 1].action).toBe('Safe state');
    });

    it('should find a safe sequence', () => {
        const safeSequence = banker.findSafeSequence();
        expect(safeSequence.length).toBe(5);

        // Check if the sequence is a permutation of [0, 1, 2, 3, 4], e.g. [1, 3, 2, 0, 4]
        expect(new Set(safeSequence)).toEqual(new Set([0, 1, 2, 3, 4]));
    });

    it('should find a safe sequence completing processes with lower indices when possible', () => {
        const resources = [12, 12, 8, 10];
        const allocation = [
            [2, 0, 0, 1],
            [3, 1, 2, 1],
            [2, 1, 0, 3],
            [1, 3, 1, 2],
            [1, 4, 3, 2],
        ];
        const max = [
            [4, 2, 1, 2],
            [5, 2, 5, 2],
            [2, 3, 1, 6],
            [1, 4, 2, 4],
            [3, 6, 6, 5],
        ];

        const banker = new Banker(resources, allocation, max);
        const safeSequence = banker.findSafeSequence();
        expect(safeSequence).toEqual([0, 3, 1, 2, 4]);
    });

    it('should detect an unsafe state', () => {
        const deadlockResources = [3, 3, 2];
        const deadlockAllocation = [
            [1, 0, 0],
            [2, 0, 0],
            [2, 1, 1],
            [0, 0, 2],
        ];
        const deadlockMax = [
            [3, 2, 2],
            [6, 1, 0],
            [3, 1, 1],
            [4, 2, 2],
        ];

        const deadlockBanker = new Banker(deadlockResources, deadlockAllocation, deadlockMax);
        expect(deadlockBanker.isSafe()).toBe(false);

        const steps = deadlockBanker.getSteps();
        expect(steps[steps.length - 1].action).toBe('Deadlock detected');
    });

    it('should handle resource requests that keep the system in a safe state', () => {
        expect(banker.requestResources(1, [1, 0, 2])).toBe(true);

        const state = banker.getState();
        expect(state.allocation[1]).toEqual([3, 0, 2]);
        expect(state.need[1]).toEqual([0, 2, 0]);
        expect(state.available).toEqual([2, 3, 0]);
    });

    it('should reject resource requests that exceed need', () => {
        expect(banker.requestResources(1, [2, 0, 0])).toBe(false);

        const state = banker.getState();
        expect(state.allocation[1]).toEqual([2, 0, 0]);
        expect(state.available).toEqual([3, 3, 2]);
    });

    it('should reject resource requests that exceed available resources', () => {
        expect(banker.requestResources(1, [4, 0, 0])).toBe(false);

        const state = banker.getState();
        expect(state.allocation[1]).toEqual([2, 0, 0]);
        expect(state.available).toEqual([3, 3, 2]);
    });

    it('should reject requests that would lead to an unsafe state', () => {
        const resourcesUnsafe = [10, 5, 7];
        const allocationUnsafe = [
            [0, 1, 0],
            [3, 0, 2],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2],
        ];
        const maxUnsafe = [
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3],
        ];

        const unsafeBanker = new Banker(resourcesUnsafe, allocationUnsafe, maxUnsafe);

        expect(unsafeBanker.requestResources(0, [0, 2, 0])).toBe(false);
    });

    it('should throw an error for invalid process ID', () => {
        expect(() => banker.requestResources(-1, [1, 0, 0])).toThrow('Invalid process ID');
        expect(() => banker.requestResources(5, [1, 0, 0])).toThrow('Invalid process ID');
    });

    it('should throw an error for invalid request format', () => {
        expect(() => banker.requestResources(1, [1, 0])).toThrow('Invalid request format');
        expect(() => banker.requestResources(1, [1, 0, 0, 0])).toThrow('Invalid request format');
    });

    it('should correctly track steps during algorithm execution', () => {
        banker.isSafe();
        const steps = banker.getSteps();

        expect(steps.length).toBeGreaterThan(0);
        expect(steps[0].action).toBe('Initial state');

        // Check that each step has the required properties
        steps.forEach((step) => {
            expect(step).toHaveProperty('work');
            expect(step).toHaveProperty('finish');
            expect(step).toHaveProperty('action');
        });
    });
});
