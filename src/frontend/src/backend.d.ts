import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Holding {
    currentPrice: Price;
    ticker: string;
    shares: number;
    color: string;
    avgCost: number;
    assetType: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Portfolio {
    name: string;
    createdAt: bigint;
    holdings: Array<Holding>;
    lastUpdated: bigint;
    isPublic: boolean;
}
export interface UserProfile {
    name: string;
}
export interface Price {
    currency: string;
    change: number;
    price: number;
    changePercent: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCryptoHolding(holding: Holding): Promise<void>;
    addHolding(portfolioName: string, holding: Holding): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changePortfolioPrivacy(portfolioName: string, isPublic: boolean): Promise<void>;
    createPortfolio(name: string): Promise<void>;
    deletePortfolio(name: string): Promise<void>;
    fetchHistoricalData(symbol: string, range: string): Promise<string>;
    fetchYahooData(symbol: string): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCryptoHistoricalData(cryptoId: string, vsCurrency: string, days: string): Promise<string>;
    getCryptoHoldings(): Promise<Array<Holding>>;
    getCryptoLivePrice(cryptoId: string): Promise<string>;
    getDefaultCurrency(): Promise<string>;
    getPortfolioPerformance(_portfolioName: string, _range: string): Promise<Array<[bigint, number]>>;
    getPortfolios(): Promise<Array<Portfolio>>;
    getPublicPortfolio(owner: Principal, portfolioName: string): Promise<Portfolio>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeCryptoHolding(ticker: string): Promise<void>;
    removeHolding(portfolioName: string, ticker: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchCryptoTickers(searchTerm: string): Promise<string>;
    searchTickers(symbol: string): Promise<string>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updatePortfolio(updatedPortfolio: Portfolio): Promise<void>;
}
