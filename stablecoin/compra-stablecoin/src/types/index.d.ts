import { EIP1193Provider } from "ethers";

declare global {
    interface Window {
        ethereum: EIP1193Provider & {
            on: (event: string, callback: (...args: any[]) => void) => void;
            removeListener: (event: string, callback: (...args: any[]) => void) => void;
        };
    }
}
