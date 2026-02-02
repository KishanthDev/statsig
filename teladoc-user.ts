import { StatsigUser } from 'statsig-node';

/**
 * Interface representing the supported Statsig user attributes.
 * Based on: https://docs.statsig.com/concepts/user#user-attributes
 */
export interface ITeladocUserAttributes {
  userID?: string | number;
  userAgent?: string;
  osName?: string;
  osVersion?: string;
  browserName?: string;
  browserVersion?: string;
  ip?: string;
  country?: string;
  locale?: string;
  appVersion?: string;
  custom?: Record<string, any>;
  privateAttributes?: Record<string, any>;
  customIDs?: Record<string, string>;
  // Allow for additional raw attributes passed in during initialization
  [key: string]: any;
}

export class TeladocUser {
  private attributes: ITeladocUserAttributes;
  private statsigUser: StatsigUser | null = null;

  constructor(attributes: ITeladocUserAttributes = {}) {
    this.attributes = { ...attributes };
  }

  get userId(): string | number | undefined {
    return this.attributes.userID;
  }

  /**
   * Merges new attributes into the existing user and invalidates the cached StatsigUser.
   */
  public update(newAttributes: Partial<ITeladocUserAttributes>): void {
    this.attributes = { ...this.attributes, ...newAttributes };
    this.statsigUser = null;
  }

  /**
   * Converts the internal attributes into a format the Statsig SDK expects.
   */
  public toStatsig(): StatsigUser {
    if (this.statsigUser) return this.statsigUser;

    // Map internal keys to the explicit naming convention expected by StatsigUser
    const statsigData: StatsigUser = {
      userID: this.attributes.userID?.toString(),
      userAgent: this.attributes.userAgent,
      ip: this.attributes.ip,
      country: this.attributes.country,
      locale: this.attributes.locale,
      appVersion: this.attributes.appVersion,
      custom: this.attributes.custom,
      privateAttributes: this.attributes.privateAttributes,
      customIDs: this.attributes.customIDs || {},
    };

    // Requirement: ID must be a string. fallback to '0' if no identifiers exist.
    if (!statsigData.userID && !statsigData.customIDs) {
      statsigData.userID = '0';
    }

    this.statsigUser = statsigData;
    return this.statsigUser;
  }

  /**
   * Static factory method to build a TeladocUser from various input types.
   */
  public static build(user: any): TeladocUser {
    if (user instanceof TeladocUser) {
      return user;
    }

    if (typeof user === 'string' || typeof user === 'number') {
      return new TeladocUser({ userID: user });
    }

    if (user && typeof user === 'object') {
      // Handles objects with an .id property (like a DB model)
      if ('id' in user) {
        return new TeladocUser({ userID: user.id, ...user });
      }
      // Handles raw attribute hashes
      return new TeladocUser(user);
    }

    throw new Error(`Not able to build TeladocUser from ${typeof user} object`);
  }
}