<script lang="ts">
    type Color = 'blue' | 'green' | 'emerald' | 'red' | 'yellow' | 'indigo' | 'purple' | 'pink';
    type Size = 'sm' | 'md' | 'lg';

    let {
        color = 'blue',
        size = 'md',
        onClick = () => {},
        disabled = false,
        children,
        ...rest
    }: {
        color?: Color;
        size?: Size;
        onClick?: () => void;
        children: any;
        disabled?: boolean;
        [key: string]: any;
    } = $props();

    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        emerald: 'bg-emerald-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        indigo: 'bg-indigo-500',
        purple: 'bg-purple-500',
        pink: 'bg-pink-500',
    };

    const sizeClasses = {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-1',
        lg: 'px-4 py-2',
    };

    let buttonClass = $derived(
        `m-2 cursor-pointer rounded-md ${colorClasses[color]} ${sizeClasses[size]} text-white shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none`,
    );
</script>

<button onclick={onClick} class={buttonClass} {disabled} {...rest}>
    {@render children()}
</button>
