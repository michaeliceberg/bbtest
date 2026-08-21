// components/vk-icon.tsx

type Props = {
    className?: string;
};

export const VkIcon = ({ className }: Props) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="1" y="1" width="22" height="22" rx="6" fill="currentColor" fillOpacity="0.12" />
        <path
            d="M12.7 16.6c-4.2 0-6.6-2.9-6.7-7.6h2.1c.1 3.4 1.6 4.8 2.8 5.1V9h2v3c1.2-.1 2.4-1.4 2.8-3h2c-.3 1.9-1.7 3.3-2.7 3.9 1 .5 2.6 1.7 3.2 3.7h-2.2c-.5-1.5-1.6-2.6-3.1-2.8v2.8h-.2z"
            fill="currentColor"
        />
    </svg>
);
