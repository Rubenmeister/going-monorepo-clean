export type UUID = string;
export declare const UUID: {
    generate: () => UUID;
    isValid: (id: string) => boolean;
};
