import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), '.api_cache.json');

class FileCache {
    private cache: Record<string, { data: any; expires: number }> = {};

    constructor() {
        this.load();
    }

    private load() {
        try {
            if (fs.existsSync(CACHE_FILE)) {
                const content = fs.readFileSync(CACHE_FILE, 'utf8');
                this.cache = JSON.parse(content);
                // Clean expired on load
                const now = Date.now();
                Object.keys(this.cache).forEach(key => {
                    if (this.cache[key].expires < now) delete this.cache[key];
                });
            }
        } catch (e) {
            this.cache = {};
        }
    }

    private save() {
        try {
            fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2));
        } catch (e) { }
    }

    get<T>(key: string): T | null {
        const item = this.cache[key];
        if (!item) return null;
        if (Date.now() > item.expires) {
            delete this.cache[key];
            this.save();
            return null;
        }
        return item.data as T;
    }

    set(key: string, data: any, ttlSeconds: number = 3600): void {
        this.cache[key] = {
            data,
            expires: Date.now() + ttlSeconds * 1000
        };
        this.save();
    }

    clear(): void {
        this.cache = {};
        this.save();
    }

    remove(key: string): void {
        delete this.cache[key];
        this.save();
    }
}

export const apiCache = new FileCache();
