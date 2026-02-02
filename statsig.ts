import { Statsig, StatsigUser, StatsigOptions } from "@statsig/statsig-node-core";
import { TeladocUser } from "./teladoc-user";
import { DataStore } from "./statsig/dataStore";

export interface ITeladocRolloutOptions {
  token: string;
  environment?: { tier: string };
  localMode?: boolean;
}

export class TeladocStatsig {
  private defaultUserInstance: TeladocUser | null = null;
  private statsig: Statsig;

  constructor(options: ITeladocRolloutOptions, cache?: any) {
    const statsigOptions: StatsigOptions = {
      environment: options.environment?.tier || "production",
      // localMode is not directly available in new SDK
      ...(cache && { dataAdapter: new DataStore(cache) }),
    };

    this.statsig = new Statsig(options.token, statsigOptions);
  }

  /**
   * Initialize the SDK - must be called before using any methods
   */
  public async initialize(): Promise<void> {
    await this.statsig.initialize();
  }

  /**
   * Dynamic Config
   * @param configName - The ID of the config in Statsig console
   * @param user - The user object
   * @param parameterKey - (Optional) Specific key to fetch from the config
   */
  public getConfig(configName: string, user?: any, parameterKey?: string): any {
    const sUser = this.getStatsigUser(user);
    const config = this.statsig.getDynamicConfig(sUser, configName);

    console.log(`[Statsig Debug] Config: ${configName} | User: ${sUser.userID}`);
    console.log(`[Statsig Debug] Full Value:`, config.value);

    if (parameterKey) {
      const val = config.getValue(parameterKey, null);
      if (val === null) {
        console.warn(`⚠️ Key '${parameterKey}' not found in config '${configName}'`);
      }
      return val;
    }

    return config.value;
  }

  /**
   * Parameter Store
   * @param paramStoreName - The ID of the parameter store in Statsig console
   * @param user - The user object
   * @param parameterKey - (Optional) Specific parameter key to fetch
   */
  public getParameterStore(paramStoreName: string, user?: any, parameterKey?: string): any {
    const sUser = this.getStatsigUser(user);
    const paramStore = this.statsig.getParameterStore(sUser, paramStoreName);

    console.log(`[Statsig Debug] Param Store: ${paramStoreName} | User: ${sUser.userID}`);

    if (parameterKey) {
      const val = paramStore.getValue(parameterKey, null);
      if (val === null) {
        console.warn(`⚠️ Parameter '${parameterKey}' not found in store '${paramStoreName}'`);
      }
      return val;
    }

    return paramStore;
  }

  /**
   * Feature Gate
   */
  public checkGate(gateName: string, user?: any): boolean {
    const sUser = this.getStatsigUser(user);
    return this.statsig.checkGate(sUser, gateName);
  }

  /**
   * Shutdown the SDK gracefully
   */
  public async shutdown(): Promise<void> {
    await this.statsig.shutdown();
  }

  private getStatsigUser(user?: any): StatsigUser {
    if (user) {
      return TeladocUser.build(user).toStatsig();
    }
    return this.defaultUser.toStatsig();
  }

  private get defaultUser(): TeladocUser {
    if (!this.defaultUserInstance) {
      this.defaultUserInstance = new TeladocUser();
    }
    return this.defaultUserInstance;
  }
}
