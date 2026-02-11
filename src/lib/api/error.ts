/**
 * Custom error class for API interactions
 */
export class InmovillaApiError extends Error {
    public status: number;
    public errorCode?: number;

    constructor(message: string, status: number, errorCode?: number) {
        super(message);
        this.name = 'InmovillaApiError';
        this.status = status;
        this.errorCode = errorCode;
        Object.setPrototypeOf(this, InmovillaApiError.prototype);
    }

    static fromResponse(status: number, data: any): InmovillaApiError {
        const message = data?.mensaje || data?.message || 'Unknown API Error';
        const errorCode = data?.codigo || status;
        return new InmovillaApiError(message, status, errorCode);
    }
}

export class AuthenticationError extends InmovillaApiError {
    constructor(message: string = 'Authentication failed') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

export class RateLimitError extends InmovillaApiError {
    constructor(message: string = 'Rate limit exceeded') {
        super(message, 429);
        this.name = 'RateLimitError';
    }
}
