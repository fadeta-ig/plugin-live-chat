const TIMELINE_STEPS = [
    { key: 'ordered', label: 'Dipesan' },
    { key: 'processing', label: 'Diproses' },
    { key: 'shipped', label: 'Dikirim' },
    { key: 'completed', label: 'Selesai' },
] as const;

const activeStepIndex = (statusRaw: string): number => {
    switch (statusRaw) {
        case 'completed':
            return 3;
        case 'shipped':
            return 2;
        case 'processing':
            return 1;
        default:
            return 0;
    }
};

export const buildTimelineHtml = (statusRaw: string): string => {
    const currentIndex = activeStepIndex(statusRaw);

    const stepsHtml = TIMELINE_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const stepClass = isCompleted ? 'completed' : isActive ? 'active' : '';

        return `
            <div class="ai-woo-sa-timeline-step ${stepClass}">
                <div class="ai-woo-sa-timeline-dot" aria-hidden="true"></div>
                <span class="ai-woo-sa-timeline-label">${step.label}</span>
            </div>`;
    }).join('');

    return `
        <div class="ai-woo-sa-timeline" role="progressbar" aria-label="Status Pesanan" aria-valuenow="${currentIndex + 1}" aria-valuemin="1" aria-valuemax="4">
            ${stepsHtml}
        </div>`;
};
