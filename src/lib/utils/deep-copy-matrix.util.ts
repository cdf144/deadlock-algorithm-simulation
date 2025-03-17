/**
 * Creates a deep copy of a two-dimensional matrix.
 *
 * @template T - The type of elements in the matrix
 * @param {T[][]} matrix - The matrix to copy
 * @returns {T[][]} A new matrix with the same elements but no references to the original matrix
 *
 * @example
 * const original = [[1, 2], [3, 4]];
 * const copy = deepCopyMatrix(original);
 * copy[0][0] = 5;
 * console.log(original[0][0]); // 1, not 5
 */
export function deepCopyMatrix<T>(matrix: T[][]): T[][] {
    return matrix.map((row) => [...row]);
}
