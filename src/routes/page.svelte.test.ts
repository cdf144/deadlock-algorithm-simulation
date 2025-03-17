import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
    test('should have correct URL for image and with alt text', () => {
        render(Page);
        const image = screen.getByAltText(':3');
        expect(image).toHaveAttribute(
            'src',
            'https://cdn.discordapp.com/emojis/1026533090627174460.png',
        );
    });

    test('should render link properly with text, correct href and target', () => {
        render(Page);
        const link = screen.getByText('read if cute');
        expect(link).toBeInTheDocument();
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', 'https://svelte.dev/');
        expect(link).toHaveAttribute('target', '_blank');
    });
});
