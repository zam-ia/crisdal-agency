import type { Capability } from "./capabilities";
import type {
  CalendarContract,
  ClientContract,
  FinanceContract,
  PackageContract,
  PortfolioContract,
  ProjectContract,
  QuoteContract,
} from "./domain-schemas";

export type ModuleRepository<T> = {
  readonly readCapability: Capability;
  readonly writeCapability: Capability;
  list(): Promise<readonly T[]>;
  findById(id: string): Promise<T | null>;
  save(value: T): Promise<T>;
};

export type CrisdalOsRepositories = {
  clients: ModuleRepository<ClientContract>;
  calendar: ModuleRepository<CalendarContract>;
  projects: ModuleRepository<ProjectContract>;
  finance: ModuleRepository<FinanceContract>;
  packages: ModuleRepository<PackageContract>;
  quotes: ModuleRepository<QuoteContract>;
  portfolio: ModuleRepository<PortfolioContract>;
};

// These are contracts, not active persistence. A later phase can implement each
// repository without coupling UI routes to a monolithic JSON snapshot.
