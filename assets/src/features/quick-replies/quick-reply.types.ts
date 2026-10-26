export type QuickReplyMenuId = 'initial' | 'categories' | 'face' | 'hair' | 'body';

export type QuickReplyButton =
    | { label: string; type: 'submenu'; target: QuickReplyMenuId }
    | { label: string; type: 'query'; query: string }
    | { label: string; type: 'static'; response: string }
    | { label: string; type: 'action'; action: 'whatsapp' };
