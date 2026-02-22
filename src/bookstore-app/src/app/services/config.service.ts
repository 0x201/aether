import { Injectable } from "@angular/core";
import { Environment } from "../../types/envrionment.type";

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private config: Environment;
    constructor() { 
        this.config = (window as any)['env'] || {};
    }

    getApiEndpoint(): string {
        return this.config.BOOKSTOREAPI_HTTP || 'http://localhost:3011';
    }
}