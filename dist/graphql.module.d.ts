import { DynamicModule, OnModuleInit } from '@nestjs/common/interfaces';
import { ApplicationReferenceHost } from '@nestjs/core';
import { ApolloServer } from 'apollo-server-express';
import { GraphQLTypesLoader } from './graphql-types.loader';
import { GraphQLFactory } from './graphql.factory';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
} from './interfaces/gql-module-options.interface';
export declare class GraphQLModule implements OnModuleInit {
  private readonly appRefHost;
  private readonly options;
  private readonly graphQLFactory;
  private readonly graphqlTypesLoader;
  protected apolloServer: ApolloServer;
  constructor(
    appRefHost: ApplicationReferenceHost,
    options: GqlModuleOptions,
    graphQLFactory: GraphQLFactory,
    graphqlTypesLoader: GraphQLTypesLoader,
  );
  static forRoot(options?: GqlModuleOptions): DynamicModule;
  static forRootAsync(options: GqlModuleAsyncOptions): DynamicModule;
  private static createAsyncProviders;
  private static createAsyncOptionsProvider;
  onModuleInit(): Promise<void>;
}
