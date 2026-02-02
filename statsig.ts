import Statsig from "statsig-node";
import { TeladocUser } from "./teladoc-user";
import { DataStore } from "./statsig/dataStore";

export interface ITeladocRolloutOptions {
  token: string;
  environment?: { tier: string }; // ✅ fixed type
  localMode?: boolean;
}

export class TeladocStatsig {
  private defaultUserInstance: TeladocUser | null = null;
  private ready: Promise<any>; // ✅ wait for SDK

  constructor(options: ITeladocRolloutOptions, cache?: any) {
    const statsigOptions: any = {
      environment: options.environment,
      localMode: options.localMode || false,
    };

    if (cache) {
      statsigOptions.dataAdapter = new DataStore(cache);
    }

    // ✅ SAVE promise
    this.ready = Statsig.initialize(options.token, statsigOptions);
  }

  /**
   * Dynamic Config
   */
  public async getConfig(configName: string, user?: any): Promise<any> {
    await this.ready; // ⭐ important

    const sUser = this.getStatsigUser(user);
    const config = await Statsig.getConfig(sUser, configName);

    return config.value;
  }

  /**
   * Feature Gate
   */
  public async checkGate(gateName: string, user?: any): Promise<boolean> {
    await this.ready; // ⭐ important

    const sUser = this.getStatsigUser(user);
    return Statsig.checkGate(sUser, gateName);
  }

  private getStatsigUser(user?: any) {
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
