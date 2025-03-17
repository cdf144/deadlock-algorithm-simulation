import { describe, it, expect } from 'vitest';
import { deepCopyMatrix } from './deep-copy-matrix.util';

describe('deepCopyMatrix', () => {
    it('should create a deep copy of a matrix', () => {
        const original = [
            [1, 2],
            [3, 4],
        ];
        const copy = deepCopyMatrix(original);

        expect(copy).toEqual(original);

        copy[0][0] = 5;
        expect(original[0][0]).toBe(1);
        expect(copy[0][0]).toBe(5);
    });

    it('should work with an empty matrix', () => {
        const original: number[][] = [];
        const copy = deepCopyMatrix(original);

        expect(copy).toEqual([]);
        expect(copy).not.toBe(original);
    });

    it('should work with different types', () => {
        const original = [
            ['a', 'b'],
            ['c', 'd'],
        ];
        const copy = deepCopyMatrix(original);

        expect(copy).toEqual(original);

        copy[1][0] = 'x';
        expect(original[1][0]).toBe('c');
        expect(copy[1][0]).toBe('x');
    });

    it('should handle matrices with empty rows', () => {
        const original = [[1, 2], [], [3, 4]];
        const copy = deepCopyMatrix(original);

        expect(copy).toEqual(original);
        expect(copy[1]).toEqual([]);
        expect(copy[1]).not.toBe(original[1]);
    });
});
