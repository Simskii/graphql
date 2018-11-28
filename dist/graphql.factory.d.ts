import { MergeInfo } from 'graphql-tools/dist/Interfaces';
import { GraphQLAstExplorer } from './graphql-ast.explorer';
import { GqlModuleOptions } from './interfaces/gql-module-options.interface';
import { DelegatesExplorerService } from './services/delegates-explorer.service';
import { ResolversExplorerService } from './services/resolvers-explorer.service';
import { ScalarsExplorerService } from './services/scalars-explorer.service';
export declare class GraphQLFactory {
  private readonly resolversExplorerService;
  private readonly delegatesExplorerService;
  private readonly scalarsExplorerService;
  private readonly graphqlAstExplorer;
  constructor(
    resolversExplorerService: ResolversExplorerService,
    delegatesExplorerService: DelegatesExplorerService,
    scalarsExplorerService: ScalarsExplorerService,
    graphqlAstExplorer: GraphQLAstExplorer,
  );
  mergeOptions(options?: GqlModuleOptions): Promise<GqlModuleOptions>;
  createDelegates(): (mergeInfo: MergeInfo) => any;
  generateDefinitions(
    typeDefs: string | string[],
    options: GqlModuleOptions,
  ): Promise<void>;
}
