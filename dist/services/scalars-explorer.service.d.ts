import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { GqlModuleOptions } from '..';
import { BaseExplorerService } from './base-explorer.service';
export declare class ScalarsExplorerService extends BaseExplorerService {
  private readonly modulesContainer;
  private readonly gqlOptions;
  constructor(modulesContainer: ModulesContainer, gqlOptions: GqlModuleOptions);
  explore(): any;
  filterScalar<T extends any = any>(
    instance: T,
  ): {
    [x: number]: any;
  };
}
